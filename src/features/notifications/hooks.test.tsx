import type { ReactNode } from 'react';
import { act, renderHook, waitFor } from '@testing-library/react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AppState, type AppStateStatus } from 'react-native';
import { ApiError } from '@/api';
import type { SessionState } from '@/features/auth/session';
import { InboxProvider, useInboxBadge } from './InboxProvider';
import { useInbox } from './useInbox';
import { inboxKeys } from './state';
import type { InboxFilter } from './contracts';
import type { InboxService } from './service';
import { itemFixture, pageFixture, instant, notificationId } from './fixtures';
let mockState: SessionState,
  mockConnectivity = 'online';
let mockZone = 'UTC';
let foreground: ((state: AppStateStatus) => void) | undefined;
const mockClear = jest.fn();
jest.mock('@/features/auth/integration', () => ({
  useAuthenticationCapabilities: () => ({
    session: { getState: () => mockState, clear: mockClear, refresh: jest.fn() },
    getAccessCredential: () => 'test-access',
  }),
}));
jest.mock('@/features/auth/integration/useConnectivity', () => ({
  useAuthenticationConnectivity: () => mockConnectivity,
}));
jest.mock('@/features/today/time', () => ({
  ...jest.requireActual('@/features/today/time'),
  resolveTimeZone: () => mockZone,
}));
jest.mock('expo-router', () => ({
  useFocusEffect: (fn: () => void) => jest.requireActual('react').useEffect(fn, [fn]),
}));
const clients: QueryClient[] = [];
function setup() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  clients.push(client);
  const service: jest.Mocked<InboxService> = {
    list: jest
      .fn()
      .mockImplementation(async (_c, source, timezone) =>
        pageFixture({ filter: source, timezone, items: source === 'today' ? [] : [itemFixture()] }),
      ),
    count: jest.fn().mockResolvedValue({
      contract_version: '1.0',
      source: 'all',
      unread_count: 101,
      generated_at: instant,
    }),
    read: jest.fn().mockResolvedValue({
      contract_version: '1.0',
      source: 'all',
      notification_id: notificationId,
      is_read: true,
      read_at: instant,
      unread_count: 100,
    }),
    readAll: jest.fn().mockImplementation(async (_c, source) => ({
      contract_version: '1.0',
      source,
      marked_read_count: 101,
      unread_count: 0,
      read_at: instant,
    })),
    timezone: jest.fn().mockResolvedValue({
      contract_version: '1.0',
      timezone: 'UTC',
      version: 1,
      updated_at: instant,
    }),
  };
  const wrapper = ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={client}>
      <InboxProvider account="owner" eligible service={service}>
        {children}
      </InboxProvider>
    </QueryClientProvider>
  );
  return { client, service, wrapper };
}
beforeEach(() => {
  jest.clearAllMocks();
  mockState = { status: 'signedIn', account: { accountId: 'owner', onboardingRequired: false } };
  mockConnectivity = 'online';
  mockZone = 'UTC';
  jest.spyOn(AppState, 'addEventListener').mockImplementation((_event, listener) => {
    foreground = listener;
    return { remove: jest.fn() };
  });
});
afterEach(async () => {
  await act(async () => {
    for (const client of clients.splice(0)) {
      await client.cancelQueries();
      client.clear();
    }
    await new Promise((resolve) => setTimeout(resolve, 0));
  });
  jest.restoreAllMocks();
});
test('badge uses full all count rather than one loaded row; startup timezone sync is confirmed once', async () => {
  const { service, wrapper } = setup();
  const { result } = renderHook(() => ({ inbox: useInbox('all'), badge: useInboxBadge() }), {
    wrapper,
  });
  await waitFor(() => expect(result.current.inbox.items).toHaveLength(1));
  expect(result.current.badge?.data?.unread_count).toBe(101);
  expect(service.timezone).toHaveBeenCalledTimes(1);
});
test('pagination preserves rows on failure, retries same cursor, deduplicates and refresh restarts at page one', async () => {
  const { service, wrapper } = setup();
  service.list
    .mockResolvedValueOnce(pageFixture({ has_more: true, next_cursor: 'opaque' }))
    .mockRejectedValueOnce(new ApiError('network', 'safe'))
    .mockResolvedValueOnce(pageFixture());
  const { result } = renderHook(() => useInbox('all'), { wrapper });
  await waitFor(() => expect(result.current.query.hasNextPage).toBe(true));
  await act(async () => {
    await result.current.loadMore();
  });
  expect(result.current.items).toHaveLength(1);
  await waitFor(() => expect(result.current.query.isFetchNextPageError).toBe(true));
  await act(async () => {
    await result.current.loadMore();
  });
  expect(result.current.items).toHaveLength(1);
  expect(service.list.mock.calls[2]?.[3]).toBe('opaque');
  await act(async () => {
    await result.current.refresh();
  });
  expect(service.list.mock.calls.at(-1)?.[3]).toBeUndefined();
});
test('filter change guards late previous responses and uses source even when grouping is earlier', async () => {
  const { service, wrapper } = setup();
  let finish!: (value: ReturnType<typeof pageFixture>) => void;
  service.list.mockImplementationOnce(
    () =>
      new Promise((resolve) => {
        finish = resolve;
      }),
  );
  const { result, rerender } = renderHook(
    ({ source }: { source: InboxFilter }) => useInbox(source),
    { wrapper, initialProps: { source: 'all' as InboxFilter } },
  );
  await waitFor(() => expect(service.list).toHaveBeenCalled());
  rerender({ source: 'today' });
  await waitFor(() => expect(result.current.query.isSuccess).toBe(true));
  await act(async () => finish(pageFixture()));
  expect(result.current.items).toHaveLength(0);
});
test('duplicate read/read-all suppressed until backend confirms; failed write keeps row unread', async () => {
  const { service, wrapper } = setup();
  const { result } = renderHook(() => useInbox('all'), { wrapper });
  await waitFor(() => expect(result.current.items).toHaveLength(1));
  let finish!: (value: Awaited<ReturnType<InboxService['read']>>) => void;
  service.read.mockImplementationOnce(
    () =>
      new Promise((resolve) => {
        finish = resolve;
      }),
  );
  let pending!: Promise<boolean>;
  act(() => {
    pending = result.current.operation(itemFixture());
  });
  await waitFor(() => expect(service.read).toHaveBeenCalledTimes(1));
  await act(async () => {
    expect(await result.current.operation()).toBe(false);
    expect(await result.current.operation(itemFixture())).toBe(false);
  });
  expect(service.readAll).not.toHaveBeenCalled();
  expect(result.current.items[0]?.is_read).toBe(false);
  service.list.mockResolvedValue(
    pageFixture({ unread_count: 100, items: [itemFixture({ is_read: true, read_at: instant })] }),
  );
  await act(async () => {
    finish({
      contract_version: '1.0',
      notification_id: notificationId,
      is_read: true,
      read_at: instant,
      source: 'all',
      unread_count: 100,
    });
    await pending;
  });
  expect(result.current.items[0]?.read_at).toBe(instant);
  service.read.mockRejectedValueOnce(new ApiError('network', 'safe'));
  await act(async () => {
    expect(await result.current.operation(itemFixture())).toBe(false);
  });
  expect(result.current.failure).toBeDefined();
  expect(service.read).toHaveBeenCalledTimes(2);
});
test('read-all sends active source, never treats scoped count as global badge', async () => {
  const { service, client, wrapper } = setup();
  const { result } = renderHook(() => useInbox('plan'), { wrapper });
  await waitFor(() => expect(result.current.items).toHaveLength(1));
  service.list.mockResolvedValue(
    pageFixture({
      filter: 'plan',
      unread_count: 0,
      items: [itemFixture({ is_read: true, read_at: instant })],
    }),
  );
  await act(async () => {
    await result.current.operation();
  });
  expect(service.readAll).toHaveBeenCalledWith('test-access', 'plan');
  expect(client.getQueryData(inboxKeys.count('owner'))).toMatchObject({ unread_count: 101 });
});
test('logout cancels/clears account data and late read response cannot repopulate cache', async () => {
  const { service, client, wrapper } = setup();
  let finish!: (value: Awaited<ReturnType<InboxService['readAll']>>) => void;
  service.readAll.mockImplementationOnce(
    () =>
      new Promise((resolve) => {
        finish = resolve;
      }),
  );
  const { result, unmount } = renderHook(() => useInbox('all'), { wrapper });
  await waitFor(() => expect(result.current.items).toHaveLength(1));
  let pending!: Promise<boolean>;
  act(() => {
    pending = result.current.operation();
  });
  await waitFor(() => expect(service.readAll).toHaveBeenCalled());
  mockState = { status: 'signedOut' };
  unmount();
  await act(async () => {
    finish({
      contract_version: '1.0',
      source: 'all',
      marked_read_count: 1,
      unread_count: 0,
      read_at: instant,
    });
    await pending;
  });
  expect(client.getQueriesData({ queryKey: inboxKeys.account('owner') })).toEqual([]);
});

test('failed read stays unread and is not replayed; already-read opening makes no write', async () => {
  const { service, wrapper } = setup();
  const { result } = renderHook(() => useInbox('all'), { wrapper });
  await waitFor(() => expect(result.current.items).toHaveLength(1));
  service.read.mockRejectedValueOnce(new ApiError('network', 'safe'));
  await act(async () => {
    expect(await result.current.operation(itemFixture())).toBe(false);
  });
  expect(result.current.items[0]?.is_read).toBe(false);
  expect(result.current.failure).toBeDefined();
  await act(async () => {
    await result.current.operation(itemFixture({ is_read: true, read_at: instant }));
  });
  expect(service.read).toHaveBeenCalledTimes(1);
});
test('badge failure retains authoritative last count with stale status; never invents zero', async () => {
  const { service, wrapper } = setup();
  const { result } = renderHook(() => useInboxBadge(), { wrapper });
  await waitFor(() => expect(result.current?.data?.unread_count).toBe(101));
  service.count.mockRejectedValueOnce(new ApiError('network', 'safe'));
  await act(async () => {
    await result.current?.refetch();
  });
  await waitFor(() => expect(result.current?.stale).toBe(true));
  expect(result.current?.data?.unread_count).toBe(101);
});
test('timezone failure does not block Inbox; explicit retry confirms value and subsequent retry deduplicates', async () => {
  const { service, wrapper } = setup();
  service.timezone.mockRejectedValueOnce(new ApiError('network', 'safe'));
  const { result } = renderHook(() => useInbox('all'), { wrapper });
  await waitFor(() => expect(result.current.context.timezoneFailed).toBe(true));
  expect(result.current.items).toHaveLength(1);
  act(() => result.current.context.sync());
  await waitFor(() => expect(result.current.context.timezoneFailed).toBe(false));
  act(() => result.current.context.sync());
  expect(service.timezone).toHaveBeenCalledTimes(2);
});
test('refresh retains all pages until success and then fetches only the first page', async () => {
  const { service, wrapper } = setup();
  service.list
    .mockResolvedValueOnce(pageFixture({ has_more: true, next_cursor: 'opaque' }))
    .mockResolvedValueOnce(
      pageFixture({
        items: [itemFixture({ notification_id: '33333333-3333-4333-8333-333333333333' })],
      }),
    );
  const { result } = renderHook(() => useInbox('all'), { wrapper });
  await waitFor(() => expect(result.current.query.hasNextPage).toBe(true));
  await act(async () => {
    await result.current.loadMore();
  });
  await waitFor(() => expect(result.current.items).toHaveLength(2));
  let finish!: (page: ReturnType<typeof pageFixture>) => void;
  service.list.mockImplementationOnce(
    () =>
      new Promise((resolve) => {
        finish = resolve;
      }),
  );
  let pending!: Promise<void>;
  act(() => {
    pending = result.current.refresh();
  });
  await waitFor(() => expect(service.list).toHaveBeenCalledTimes(3));
  expect(result.current.items).toHaveLength(2);
  await act(async () => {
    finish(pageFixture({ has_more: true, next_cursor: 'new-opaque' }));
    await pending;
  });
  await waitFor(() => expect(result.current.query.hasNextPage).toBe(true));
  expect(result.current.items).toHaveLength(1);
  expect(service.list).toHaveBeenCalledTimes(3);
});
test('invalid cursor preserves confirmed rows and explicit restart discards the invalid continuation', async () => {
  const { service, wrapper } = setup();
  service.list
    .mockResolvedValueOnce(pageFixture({ has_more: true, next_cursor: 'expired-opaque' }))
    .mockRejectedValueOnce(
      new ApiError('http', 'safe', { status: 422, code: 'request_validation_failed' }),
    );
  const { result } = renderHook(() => useInbox('all'), { wrapper });
  await waitFor(() => expect(result.current.query.hasNextPage).toBe(true));
  await act(async () => {
    await result.current.loadMore();
  });
  await waitFor(() => expect(result.current.query.isFetchNextPageError).toBe(true));
  expect(result.current.items).toHaveLength(1);
  await act(async () => {
    await result.current.refresh();
  });
  expect(service.list.mock.calls.at(-1)?.[3]).toBeUndefined();
});

test('foreground rechecks timezone, deduplicates unchanged value and resets list to changed timezone', async () => {
  const { service, wrapper } = setup();
  service.timezone.mockImplementation(async (_c, zone) => ({
    contract_version: '1.0',
    timezone: zone,
    version: 2,
    updated_at: instant,
  }));
  const { result } = renderHook(() => useInbox('all'), { wrapper });
  await waitFor(() => expect(result.current.items).toHaveLength(1));
  await act(async () => foreground?.('active'));
  expect(service.timezone).toHaveBeenCalledTimes(1);
  mockZone = 'Europe/London';
  await act(async () => foreground?.('active'));
  await waitFor(() => expect(result.current.context.zone).toBe('Europe/London'));
  expect(service.timezone).toHaveBeenCalledTimes(2);
  expect(service.list.mock.calls.at(-1)?.[2]).toBe('Europe/London');
  expect(service.list.mock.calls.at(-1)?.[3]).toBeUndefined();
});
test('401 count failure delegates shared session recovery and keys never contain cursors or content', async () => {
  const { service, client, wrapper } = setup();
  service.count.mockRejectedValue(new ApiError('http', 'safe', { status: 401 }));
  renderHook(() => useInbox('all'), { wrapper });
  await waitFor(() => expect(mockClear).toHaveBeenCalled());
  const keys = client
    .getQueryCache()
    .getAll()
    .map((query) => query.queryKey);
  expect(keys).toContainEqual(['notification-inbox', 'owner', 'list', 'all', 'UTC']);
  expect(JSON.stringify(keys)).not.toContain('Plan starts soon');
});
