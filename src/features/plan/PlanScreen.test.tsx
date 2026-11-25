import { act, fireEvent, render } from '@testing-library/react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { ThemeProvider } from '@/design-system/theme';
import { ApiError } from '@/api';
import { PlanScreen } from './PlanScreen';
import { dayItem, planFixture } from './testFixtures';
import type { PlanDateResource } from './validation';
const mockOpen = jest.fn(),
  mockRefresh = jest.fn(),
  mockLoad = jest.fn();
let mockData: PlanDateResource | undefined,
  mockError: Error | null = null,
  mockMore = false,
  mockOffline = false;
jest.mock('expo-router', () => ({ useLocalSearchParams: () => ({ selectedDate: '2026-10-02' }) }));
jest.mock('./usePlanDate', () => ({
  usePlanDate: () => ({
    data: mockData,
    items: mockData?.items ?? [],
    query: {
      isPending: !mockData,
      isFetching: false,
      error: mockError,
      hasNextPage: mockMore,
      isFetchNextPageError: !!mockError,
    },
    connectivity: mockOffline ? 'offline' : 'online',
    refresh: mockRefresh,
    loadMore: mockLoad,
  }),
}));
jest.mock('@/features/today/usePlanAction', () => ({ usePlanAction: () => mockOpen }));
jest.mock('@/features/today/useReturnFocus', () => ({ useReturnFocus: () => jest.fn() }));
jest.mock('@/features/today/motion', () => ({ useReducedMotion: () => ({ reduced: true }) }));
jest.mock('@/features/today/NativePicker', () => ({ NativePicker: () => null }));
jest.mock('@/features/app-shell/ShellHeader', () => ({ ShellHeader: () => null }));
const mockVoiceOpen = jest.fn();
let mockVoiceEnabled = false;
jest.mock('@/features/voice/availability', () => ({
  useVoiceAvailability: () => ({ enabled: mockVoiceEnabled }),
}));
jest.mock('@/features/voice/VoiceEntryProvider', () => ({
  useVoiceEntry: () => ({ open: mockVoiceOpen }),
}));
function screen(mode: 'light' | 'dark' = 'light') {
  return render(
    <SafeAreaProvider
      initialMetrics={{
        frame: { x: 0, y: 0, width: 390, height: 844 },
        insets: { top: 47, right: 0, bottom: 34, left: 0 },
      }}
    >
      <ThemeProvider preference={mode}>
        <PlanScreen />
      </ThemeProvider>
    </SafeAreaProvider>,
  );
}
beforeEach(() => {
  jest.clearAllMocks();
  mockData = planFixture();
  mockError = null;
  mockMore = false;
  mockOffline = false;
  mockVoiceEnabled = false;
});
test.each(['light', 'dark'] as const)(
  'empty %s state, summary null and supported creation',
  (mode) => {
    const view = screen(mode);
    expect(view.getByText('No items yet')).toBeTruthy();
    expect(view.queryByText('0%')).toBeNull();
    expect(view.getByRole('header', { name: 'Plan Insight' })).toBeTruthy();
    expect(view.getByRole('header', { name: 'Scheduled' })).toBeTruthy();
    fireEvent.press(view.getByRole('button', { name: 'Add plan item' }));
    expect(mockOpen).toHaveBeenCalledWith('plan_item.create');
  },
);
test('current labels, priority and backend item CTA', () => {
  mockData = planFixture(undefined, [
    dayItem({
      section: 'scheduled_incomplete',
      timing_state: 'ongoing',
      scheduled_start_at: '2026-10-02T14:00:00Z',
      is_priority: true,
    }),
  ]);
  const view = screen();
  expect(view.getByText('0%')).toBeTruthy();
  fireEvent.press(view.getByRole('button', { name: /View .*Ongoing, Priority/ }));
  expect(mockOpen).toHaveBeenCalledWith('plan_item.view', mockData.items[0]!.id);
});
test('past neutral schedule with current-state wording and isolated insight', () => {
  mockData = planFixture(undefined, [
    dayItem({
      section: 'scheduled_incomplete',
      timing_state: 'past',
      scheduled_start_at: '2026-10-02T14:00:00Z',
    }),
  ]);
  mockData.date_relation = 'past';
  mockData.insight = {
    ...mockData.insight,
    state: 'unavailable',
    code: 'insight_unavailable',
    recommendation: 'Insight unavailable',
    action: null,
  };
  const view = screen();
  expect(view.getByText('Still incomplete')).toBeTruthy();
  expect(view.queryByText('Past scheduled time')).toBeNull();
  expect(view.queryByRole('button', { name: 'View recommended item' })).toBeNull();
  expect(view.getByRole('header', { name: 'Daily Summary' })).toBeTruthy();
});
test('completed preview expansion and loaded totals distinct from full date', () => {
  const items = Array.from({ length: 5 }, (_, i) =>
    dayItem({
      id: `00000000-0000-4000-8000-${String(i + 1).padStart(12, '0')}`,
      title: `Done ${i + 1}`,
      section: 'completed',
      timing_state: 'completed',
      completed_at: '2026-10-02T14:00:00Z',
    }),
  );
  mockData = planFixture(undefined, items);
  mockData.summary = {
    total: 9,
    completed: 8,
    remaining: 1,
    scheduled_remaining: 0,
    unscheduled_remaining: 1,
    completion_percentage: 89,
  };
  mockMore = true;
  const view = screen();
  expect(view.queryByText('Done 4')).toBeNull();
  expect(view.getByText('5 loaded · 8 currently completed across this date')).toBeTruthy();
  fireEvent.press(view.getByRole('button', { name: 'Show all 5 loaded completed items' }));
  expect(view.getByText('Done 5')).toBeTruthy();
  expect(
    view.getByRole('button', { name: 'Show fewer completed items' }).props.accessibilityState
      .expanded,
  ).toBe(true);
  fireEvent.press(view.getByRole('button', { name: 'Load more items' }));
  expect(mockLoad).toHaveBeenCalledTimes(1);
});
test('same-date confirmed content survives failure with explicit cursor recovery', async () => {
  mockData = planFixture(undefined, [dayItem()]);
  mockError = new ApiError('http', 'private-error', {
    status: 422,
    code: 'request_validation_failed',
    requestId: 'safe-plan',
  });
  mockMore = true;
  const view = screen();
  expect(
    view.getByText('Refresh failed · showing confirmed information for this date'),
  ).toBeTruthy();
  await act(async () =>
    fireEvent.press(view.getByRole('button', { name: 'Reload date from first page' })),
  );
  expect(mockRefresh).toHaveBeenCalled();
  expect(view.queryByText('private-error')).toBeNull();
  expect(view.getByText('Support ID: safe-plan')).toBeTruthy();
});

test('the mic is absent unless voice is available, and then opens for the selected date', () => {
  const hidden = screen();
  expect(hidden.queryByRole('button', { name: 'Add by voice' })).toBeNull();
  hidden.unmount();
  mockVoiceEnabled = true;
  const view = screen();
  expect(view.getByRole('button', { name: 'Add plan item' })).toBeTruthy();
  fireEvent.press(view.getByRole('button', { name: 'Add by voice' }));
  expect(mockVoiceOpen).toHaveBeenCalledWith('plan', expect.stringMatching(/^\d{4}-\d{2}-\d{2}$/));
});
