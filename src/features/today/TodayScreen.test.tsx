import { fireEvent, render } from '@testing-library/react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { ThemeProvider } from '@/design-system/theme';
import { SessionProvider } from '@/features/auth/session';
import { TodayScreen } from './TodayScreen';
import { todayFixture, itemId } from './testFixtures';
import type { TodayResource } from './types';
const mockOpen = jest.fn(),
  mockRefresh = jest.fn();
let mockData: TodayResource | undefined,
  mockError: Error | null = null,
  mockConnectivity = 'online',
  mockPending = false;
jest.mock('./useToday', () => ({
  useToday: () => ({
    query: { data: mockData, error: mockError, isPending: mockPending, isFetching: false },
    timezone: 'America/New_York',
    connectivity: mockConnectivity,
    refresh: mockRefresh,
  }),
}));
jest.mock('./useReturnFocus', () => ({ useReturnFocus: () => jest.fn() }));
jest.mock('./usePlanAction', () => ({ usePlanAction: () => mockOpen }));
jest.mock('@/features/app-shell/ShellHeader', () => ({ ShellHeader: () => null }));
const mockVoiceOpen = jest.fn();
let mockVoiceEnabled = false;
jest.mock('@/features/voice/availability', () => ({
  useVoiceAvailability: () => ({ enabled: mockVoiceEnabled }),
}));
jest.mock('@/features/voice/VoiceEntryProvider', () => ({
  useVoiceEntry: () => ({ open: mockVoiceOpen }),
}));
function wrap(mode: 'light' | 'dark' = 'light') {
  return (
    <SafeAreaProvider
      initialMetrics={{
        frame: { x: 0, y: 0, width: 390, height: 844 },
        insets: { top: 47, right: 0, bottom: 34, left: 0 },
      }}
    >
      <ThemeProvider preference={mode}>
        <SessionProvider state={{ status: 'signedOut' }}>
          <TodayScreen />
        </SessionProvider>
      </ThemeProvider>
    </SafeAreaProvider>
  );
}
beforeEach(() => {
  mockData = todayFixture();
  mockError = null;
  mockConnectivity = 'online';
  mockPending = false;
  mockVoiceEnabled = false;
  jest.clearAllMocks();
});
test.each(['light', 'dark'] as const)(
  'honest empty dashboard and accessible breakdown in %s',
  (mode) => {
    const view = render(wrap(mode));
    expect(view.getByText('No score yet')).toBeTruthy();
    expect(view.queryByText('84%')).toBeNull();
    expect(view.getByText('No measurable progress yet')).toBeTruthy();
    expect(view.queryByText('Log Meal')).toBeNull();
    fireEvent.press(view.getByRole('button', { name: 'Create a plan item' }));
    expect(mockOpen).toHaveBeenCalledWith('plan_item.create', null);
    fireEvent.press(view.getByRole('button', { name: 'View score breakdown, no score yet' }));
    expect(view.getByRole('header', { name: 'Today’s score breakdown' })).toBeTruthy();
    expect(view.getByText('0 completed / 0 eligible items')).toBeTruthy();
    fireEvent.press(view.getByRole('button', { name: 'Close score breakdown' }));
  },
);
test('zero remains 0%; backend chronology and labels are not reranked', () => {
  const data = todayFixture();
  data.score = {
    state: 'available',
    percentage: 0,
    numerator: 0,
    denominator: 1,
    breakdown: [
      {
        item_id: itemId,
        domain: 'plan_item',
        eligibility_reason: 'assigned_current_local_date',
        weight: 1,
        earned_weight: 0,
        completion_state: 'incomplete',
      },
    ],
  };
  data.daily_status.eligible = 1;
  data.daily_status.remaining = 1;
  data.up_next = {
    state: 'available',
    action: 'plan_item.create',
    items: [
      {
        label: 'NEXT',
        item: {
          plan_item_id: itemId,
          title: 'First from backend',
          scheduled_start_at: '2026-10-02T22:00:00Z',
          scheduled_end_at: '2026-10-02T22:30:00Z',
          scheduled_for_date: '2026-10-02',
          timezone: 'America/New_York',
          domain: 'plan_item',
          state: 'incomplete',
          action: 'plan_item.view',
          completed_at: null,
        },
      },
      {
        label: 'LATER',
        item: {
          plan_item_id: '20000000-0000-4000-8000-000000000002',
          title: 'Second from backend',
          scheduled_start_at: '2026-10-02T23:00:00Z',
          scheduled_end_at: null,
          scheduled_for_date: '2026-10-02',
          timezone: 'America/New_York',
          domain: 'plan_item',
          state: 'incomplete',
          action: 'plan_item.view',
          completed_at: null,
        },
      },
    ],
  };
  mockData = data;
  const view = render(wrap());
  expect(view.getByText('0%')).toBeTruthy();
  expect(view.queryByText('No score yet')).toBeNull();
  expect(view.getAllByRole('button').map((button) => button.props.accessibilityLabel)).toEqual(
    expect.arrayContaining(['View First from backend, NEXT', 'View Second from backend, LATER']),
  );
  fireEvent.press(view.getByRole('button', { name: 'View First from backend, NEXT' }));
  expect(mockOpen).toHaveBeenCalledWith('plan_item.view', itemId);
});
test('confirmed content survives refresh failure/offline without invented empty success', () => {
  mockConnectivity = 'offline';
  const view = render(wrap());
  expect(view.getByText('Offline · showing previously confirmed information')).toBeTruthy();
  fireEvent.press(view.getByRole('button', { name: 'Retry Today' }));
  expect(mockRefresh).toHaveBeenCalledTimes(1);
  view.unmount();
  mockData = undefined;
  const initial = render(wrap());
  expect(initial.getByText('Today hasn’t loaded yet. Connect and try again.')).toBeTruthy();
  expect(initial.queryByText('No score yet')).toBeNull();
  expect(initial.queryByText('Start with one plan item')).toBeNull();
});
test('unsupported create capability hides working quick actions', () => {
  mockData = todayFixture();
  mockData.capabilities.actions = [];
  const view = render(wrap());
  expect(view.queryByRole('button', { name: 'Create a plan item' })).toBeNull();
  expect(view.queryByText('Quick Actions')).toBeNull();
});

test('the mic is absent unless voice is available, and then sits next to Add plan item', () => {
  const hidden = render(wrap());
  expect(hidden.queryByRole('button', { name: 'Add by voice' })).toBeNull();
  hidden.unmount();
  mockVoiceEnabled = true;
  const view = render(wrap());
  expect(view.getByRole('button', { name: 'Add plan item' })).toBeTruthy();
  fireEvent.press(view.getByRole('button', { name: 'Add by voice' }));
  expect(mockVoiceOpen).toHaveBeenCalledWith('today', expect.stringMatching(/^\d{4}-\d{2}-\d{2}$/));
});
