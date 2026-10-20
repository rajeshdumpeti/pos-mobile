import { act, fireEvent, render, waitFor } from '@testing-library/react-native';
import { TextInput as NativeTextInput } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { ThemeProvider } from '@/design-system/theme';
import { PlanItemFormScreen } from './PlanItemFormScreen';
import type { PlanContext } from '@/features/plan/calendar';
import { createCreationCoordinator } from './creation';
import type { SavedPlanDraft } from './PlanningProvider';
import { itemFixture, itemId } from './testFixtures';
const mockCreate = jest.fn(),
  mockUpdate = jest.fn(),
  mockBack = jest.fn(),
  mockReplace = jest.fn();
const mockFocus = jest.spyOn(NativeTextInput.prototype, 'focus');
const mockListeners = new Map<string, Set<(event: { data: { closing: boolean } }) => void>>();
const mockNavigation = {
  dispatch: jest.fn(),
  isFocused: jest.fn(() => true),
  addListener: jest.fn(
    (name: string, listener: (event: { data: { closing: boolean } }) => void) => {
      const listeners = mockListeners.get(name) ?? new Set();
      listeners.add(listener);
      mockListeners.set(name, listeners);
      return () => listeners.delete(listener);
    },
  ),
};
function emitNavigation(name: string, closing = false) {
  act(() => mockListeners.get(name)?.forEach((listener) => listener({ data: { closing } })));
}
let mockItem: ReturnType<typeof itemFixture> | undefined;
const mockDrafts = new Map<string, SavedPlanDraft>();
let mockCreation = createCreationCoordinator();
jest.mock('expo-router', () => ({
  useRouter: () => ({ replace: mockReplace, navigate: jest.fn(), canGoBack: () => false }),
  useNavigation: () => mockNavigation,
}));
jest.mock('expo-router/react-navigation', () => ({ usePreventRemove: jest.fn() }));
jest.mock('./NativePicker', () => ({ NativePicker: () => null }));
jest.mock('@/navigation', () => ({
  routes: { app: { index: '/', plan: '/plan', planItem: '/plan-item' } },
  useSafeNavigation: () => ({ backOrReplace: mockBack }),
}));
jest.mock('./PlanningProvider', () => ({
  usePlanning: () => ({ creation: mockCreation, drafts: mockDrafts, current: () => true }),
}));
jest.mock('./usePlanItem', () => ({
  usePlanItem: () => ({ data: mockItem, isPending: false, refetch: jest.fn() }),
}));
jest.mock('./usePlanMutations', () => ({
  usePlanMutations: () => ({
    busy: false,
    create: mockCreate,
    update: mockUpdate,
    reviewRequired: false,
  }),
}));
jest.mock('@/features/auth/integration/useConnectivity', () => ({
  useAuthenticationConnectivity: () => 'online',
}));
function screen(edit = false, context?: PlanContext) {
  return render(
    <SafeAreaProvider
      initialMetrics={{
        frame: { x: 0, y: 0, width: 390, height: 844 },
        insets: { top: 47, right: 0, bottom: 34, left: 0 },
      }}
    >
      <ThemeProvider preference="light">
        <PlanItemFormScreen
          mode={edit ? 'edit' : 'create'}
          id={edit ? itemId : undefined}
          context={context}
        />
      </ThemeProvider>
    </SafeAreaProvider>,
  );
}
beforeEach(() => {
  jest.clearAllMocks();
  mockListeners.clear();
  mockNavigation.isFocused.mockReturnValue(true);
  mockDrafts.clear();
  mockItem = undefined;
  mockCreation = createCreationCoordinator();
  mockCreate.mockResolvedValue(itemFixture());
  mockUpdate.mockResolvedValue(itemFixture({ version: 2 }));
});
test('accessible field validation blocks invalid creation then submits a deliberate intent', async () => {
  const view = screen();
  fireEvent.press(view.getByRole('button', { name: 'Create plan item' }));
  await waitFor(() =>
    expect(view.getByLabelText('Title').props.accessibilityHint).toBe(
      'Add a title (up to 200 characters).',
    ),
  );
  expect(mockCreate).not.toHaveBeenCalled();
  fireEvent.changeText(view.getByLabelText('Title'), 'Prepare report');
  fireEvent.press(view.getByRole('button', { name: 'Create plan item' }));
  await waitFor(() =>
    expect(mockCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        title: 'Prepare report',
        scheduled_start_at: null,
        scheduled_end_at: null,
      }),
    ),
  );
  await waitFor(() =>
    expect(mockReplace).toHaveBeenCalledWith({ pathname: '/plan-item', params: { id: itemId } }),
  );
});
test('editing preserves expected version and explicitly clears optional scheduling', async () => {
  mockItem = itemFixture({
    version: 7,
    scheduled_start_at: '2026-10-02T22:00:00.123Z',
    scheduled_end_at: '2026-10-02T23:00:00Z',
  });
  const view = screen(true);
  await waitFor(() =>
    expect(view.getByRole('button', { name: 'Start time, 6:00 PM' })).toBeTruthy(),
  );
  fireEvent.press(view.getByRole('checkbox', { name: 'Schedule a time' }));
  fireEvent.press(view.getByRole('button', { name: 'Save changes' }));
  await waitFor(() =>
    expect(mockUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        expected_version: 7,
        scheduled_start_at: null,
        scheduled_end_at: null,
      }),
    ),
  );
  await waitFor(() => expect(mockBack).toHaveBeenCalledWith('/'));
});

test('untouched title stays neutral and a dismissed draft restores without a save', async () => {
  const view = screen();
  expect(view.getByLabelText('Title').props.accessibilityHint).toBeUndefined();
  expect(view.queryByLabelText('Timezone')).toBeNull();
  expect(view.queryByLabelText('Assigned date')).toBeNull();
  fireEvent.changeText(view.getByLabelText('Title'), 'Keep this draft');
  view.unmount();
  const restored = screen();
  expect(restored.getByLabelText('Title').props.value).toBe('Keep this draft');
  expect(mockCreate).not.toHaveBeenCalled();
  expect(mockUpdate).not.toHaveBeenCalled();
});
test('restored edit keeps its original version until reconciliation', async () => {
  mockDrafts.set(`edit:${itemId}`, {
    values: {
      title: 'Unsaved change',
      date: '2026-10-02',
      timezone: 'America/New_York',
      scheduled: false,
      start: '',
      end: '',
      priority: true,
    },
    version: 3,
  });
  mockItem = itemFixture({ version: 8 });
  const view = screen(true);
  fireEvent.press(view.getByRole('button', { name: 'Save changes' }));
  await waitFor(() =>
    expect(mockUpdate).toHaveBeenCalledWith(
      expect.objectContaining({ expected_version: 3, title: 'Unsaved change' }),
    ),
  );
});

test('autofocus blur alone stays neutral; an interacted empty title shows validation', () => {
  const view = screen();
  fireEvent(view.getByLabelText('Title'), 'blur');
  expect(view.getByLabelText('Title').props.accessibilityHint).toBeUndefined();
  fireEvent.changeText(view.getByLabelText('Title'), '');
  fireEvent(view.getByLabelText('Title'), 'blur');
  expect(view.getByLabelText('Title').props.accessibilityHint).toBe(
    'Add a title (up to 200 characters).',
  );
  expect(mockCreate).not.toHaveBeenCalled();
});

afterEach(() => jest.useRealTimers());

test('title focuses only after modal presentation and the keyboard settling delay', () => {
  jest.useFakeTimers();
  const view = screen();
  act(() => jest.advanceTimersByTime(1000));
  expect(mockFocus).not.toHaveBeenCalled();
  emitNavigation('transitionEnd');
  act(() => jest.advanceTimersByTime(179));
  expect(mockFocus).not.toHaveBeenCalled();
  act(() => jest.advanceTimersByTime(1));
  expect(mockFocus).toHaveBeenCalledTimes(1);
  view.unmount();
});

test.each(['blur', 'transitionStart', 'unmount'])(
  'pending title focus is cancelled on %s',
  (event) => {
    jest.useFakeTimers();
    const view = screen();
    emitNavigation('transitionEnd');
    if (event === 'unmount') view.unmount();
    else emitNavigation(event, true);
    act(() => jest.advanceTimersByTime(180));
    expect(mockFocus).not.toHaveBeenCalled();
    view.unmount();
    expect([...mockListeners.values()].every((listeners) => listeners.size === 0)).toBe(true);
  },
);

test('closing transitions and edit forms do not autofocus', () => {
  jest.useFakeTimers();
  const view = screen();
  emitNavigation('transitionEnd', true);
  act(() => jest.advanceTimersByTime(180));
  expect(mockFocus).not.toHaveBeenCalled();
  view.unmount();
  mockItem = itemFixture();
  const edit = screen(true);
  emitNavigation('transitionEnd');
  act(() => jest.advanceTimersByTime(180));
  expect(mockFocus).not.toHaveBeenCalled();
  edit.unmount();
});

test('Plan creation defaults to selected date, unscheduled and non-priority, then returns to that date', async () => {
  const context: PlanContext = { origin: 'plan', selectedDate: '2026-11-01' };
  const view = screen(false, context);
  fireEvent.changeText(view.getByLabelText('Title'), 'Prepare report');
  fireEvent.press(view.getByRole('button', { name: 'Create plan item' }));
  await waitFor(() =>
    expect(mockCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        scheduled_for_date: context.selectedDate,
        timezone: expect.any(String),
        scheduled_start_at: null,
        scheduled_end_at: null,
        is_priority: false,
      }),
    ),
  );
  await waitFor(() =>
    expect(mockReplace).toHaveBeenCalledWith({
      pathname: '/plan',
      params: { selectedDate: context.selectedDate },
    }),
  );
});
