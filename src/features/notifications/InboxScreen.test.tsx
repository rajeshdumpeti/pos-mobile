import { act, fireEvent, render, waitFor } from '@testing-library/react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { ThemeProvider } from '@/design-system/theme';
import { InboxContent } from './InboxScreen';
import { pageFixture, itemFixture } from './fixtures';
import type { InboxFilter } from './contracts';
const mockPush = jest.fn(),
  mockNavigate = jest.fn(),
  mockRead = jest.fn(),
  mockGet = jest.fn(),
  mockToday = jest.fn();
let mockData = pageFixture(),
  mockPermission = 'denied';
jest.mock('expo-router', () => ({ useRouter: () => ({ push: mockPush, navigate: mockNavigate }) }));
jest.mock('@/features/today/useReturnFocus', () => ({ useReturnFocus: () => jest.fn() }));
jest.mock('@/features/today/PlanningProvider', () => ({
  usePlanning: () => ({
    service: { get: mockGet, today: mockToday },
    credential: () => 'test-access',
    recover: jest.fn(),
  }),
}));
jest.mock('@/features/notification-permission/usePermission', () => ({
  usePermission: () => ({ status: mockPermission }),
}));
jest.mock('./useInbox', () => ({
  useInbox: (source: InboxFilter) => ({
    query: { isSuccess: true, isFetching: false, isError: false, data: { pages: [mockData] } },
    items: mockData.items.filter((i) => source === 'all' || i.source === source),
    unreadCount: mockData.unread_count,
    connectivity: 'online',
    busy: false,
    context: { zone: 'UTC', current: () => true },
    operation: mockRead,
    refresh: jest.fn(),
  }),
}));
function wrap(mode: 'light' | 'dark' = 'light') {
  return (
    <SafeAreaProvider
      initialMetrics={{
        frame: { x: 0, y: 0, width: 320, height: 720 },
        insets: { top: 20, left: 0, right: 0, bottom: 20 },
      }}
    >
      <ThemeProvider preference={mode}>
        <InboxContent close={jest.fn()} />
      </ThemeProvider>
    </SafeAreaProvider>
  );
}
beforeEach(() => {
  jest.clearAllMocks();
  mockData = pageFixture();
  mockPermission = 'denied';
  mockRead.mockResolvedValue(true);
  mockGet.mockResolvedValue({ scheduled_for_date: '2026-10-31' });
});
test.each(['light', 'dark'] as const)(
  'source filters and server grouping accessible in %s with permission denied',
  (mode) => {
    const view = render(wrap(mode));
    expect(view.getByText('Earlier')).toBeTruthy();
    expect(
      view.getByRole('tab', { name: 'All notifications' }).props.accessibilityState.selected,
    ).toBe(true);
    expect(view.getByText('101 unread')).toBeTruthy();
    expect(view.getByRole('button', { name: /Unread. Plan. Plan starts soon/ })).toBeTruthy();
    fireEvent.press(view.getByRole('tab', { name: 'Today notifications' }));
    expect(view.getByText('You’re all caught up')).toBeTruthy();
    expect(view.queryByText('Plan starts soon')).toBeNull();
    expect(mockRead).not.toHaveBeenCalled();
  },
);
test('failed mark read never navigates; confirmed read opens allow-listed detail with minimal params', async () => {
  const view = render(wrap());
  mockRead.mockResolvedValueOnce(false);
  await act(async () =>
    fireEvent.press(view.getByRole('button', { name: /Unread. Plan. Plan starts soon/ })),
  );
  expect(mockPush).not.toHaveBeenCalled();
  await act(async () =>
    fireEvent.press(view.getByRole('button', { name: /Unread. Plan. Plan starts soon/ })),
  );
  expect(mockPush).toHaveBeenCalledWith({
    pathname: '/(app)/plan-item',
    params: { id: mockData.items[0]?.navigation.plan_item_id, selectedDate: '2026-10-31' },
  });
  expect(mockGet).toHaveBeenCalledTimes(1);
});
test('unavailable sources remain visible and markable without a destination', async () => {
  mockData = pageFixture({
    items: [
      itemFixture({
        navigation: { state: 'unavailable', action: null, selected_date: null, plan_item_id: null },
      }),
    ],
  });
  const view = render(wrap());
  await act(async () =>
    fireEvent.press(view.getByRole('button', { name: /Unread. Plan. Plan starts soon/ })),
  );
  expect(mockRead).toHaveBeenCalled();
  expect(mockPush).not.toHaveBeenCalled();
  await waitFor(() => expect(view.getByText('This item is no longer available.')).toBeTruthy());
});

test('Today navigation revalidates authoritative server date rather than silently redirecting historical context', async () => {
  mockData = pageFixture({
    items: [
      itemFixture({
        source: 'today',
        event_type: 'today.items_remaining',
        navigation: {
          state: 'available',
          action: 'today.view',
          selected_date: '2026-10-30',
          plan_item_id: null,
        },
      }),
    ],
  });
  mockToday
    .mockResolvedValueOnce({ local_date: '2026-10-31' })
    .mockResolvedValueOnce({ local_date: '2026-10-30' });
  const view = render(wrap());
  await act(async () =>
    fireEvent.press(view.getByRole('button', { name: /Unread. Today. Plan starts soon/ })),
  );
  expect(mockNavigate).not.toHaveBeenCalled();
  expect(
    view.getByText('Historical Today views are not available for this notification.'),
  ).toBeTruthy();
  await act(async () =>
    fireEvent.press(view.getByRole('button', { name: /Unread. Today. Plan starts soon/ })),
  );
  expect(mockNavigate).toHaveBeenCalledWith('/(app)/(tabs)');
});
