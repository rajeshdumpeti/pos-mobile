import { act, renderHook, waitFor } from '@testing-library/react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AppState, type AppStateStatus } from 'react-native';
import type { ReactNode } from 'react';
import type { SessionState } from '@/features/auth/session';
import { ApiError } from '@/api';
import {
  PlanningProvider,
  planningKeys,
  clearPlanningAccount,
  usePlanning,
} from './PlanningProvider';
import { useToday, planningQueryPolicy } from './useToday';
import { usePlanMutations, planningMutationPolicy } from './usePlanMutations';
import { usePlanItem } from './usePlanItem';
import * as time from './time';
import { todayFixture, itemFixture, itemId, accountA, accountB } from './testFixtures';
import type { PlanningService } from './service';
let mockState: SessionState = {
  status: 'signedIn',
  account: { accountId: accountA, onboardingRequired: false },
};
let mockConnectivity = 'online';
const mockClear = jest.fn(),
  mockRefreshSession = jest.fn();
jest.mock('@/features/auth/integration', () => ({
  useAuthenticationCapabilities: () => ({
    session: { getState: () => mockState, clear: mockClear, refresh: mockRefreshSession },
    getAccessCredential: () => 'test-access',
  }),
}));
jest.mock('@/features/auth/integration/useConnectivity', () => ({
  useAuthenticationConnectivity: () => mockConnectivity,
}));
const clients: QueryClient[] = [];
function setup() {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  clients.push(client);
  const service: jest.Mocked<PlanningService> = {
    selectedDate: jest.fn(),
    today: jest.fn().mockResolvedValue(todayFixture()),
    get: jest.fn().mockResolvedValue(itemFixture()),
    create: jest.fn().mockResolvedValue(itemFixture()),
    update: jest.fn().mockResolvedValue(itemFixture({ version: 2 })),
    complete: jest
      .fn()
      .mockResolvedValue(
        itemFixture({ version: 2, is_priority: false, completed_at: '2026-10-02T15:00:00Z' }),
      ),
  };
  const wrapper = ({ children }: { children: ReactNode }) => {
    const account = mockState.status === 'signedIn' ? mockState.account.accountId : accountA;
    return (
      <QueryClientProvider client={client}>
        <PlanningProvider key={account} account={account} service={service}>
          {children}
        </PlanningProvider>
      </QueryClientProvider>
    );
  };
  return { client, service, wrapper };
}
beforeEach(() => {
  mockState = { status: 'signedIn', account: { accountId: accountA, onboardingRequired: false } };
  mockConnectivity = 'online';
  jest.clearAllMocks();
  jest.spyOn(AppState, 'addEventListener').mockImplementation(() => ({ remove: jest.fn() }));
});
afterEach(() => {
  clients.splice(0).forEach((client) => client.clear());
  jest.restoreAllMocks();
});
test('policy explicitly forbids automatic/offline/reconnect mutation replay', () => {
  expect(planningMutationPolicy).toMatchObject({ retry: false, networkMode: 'always', gcTime: 0 });
  expect(planningQueryPolicy).toMatchObject({
    retry: false,
    refetchOnReconnect: false,
    refetchOnWindowFocus: false,
    gcTime: 0,
  });
});
test('confirmed update uses version and completion advances only after success', async () => {
  const { client, service, wrapper } = setup();
  const { result } = renderHook(
    () => ({ item: usePlanItem(itemId), mutations: usePlanMutations(itemId) }),
    { wrapper },
  );
  await waitFor(() => expect(result.current.item.data).toBeDefined());
  await act(async () => {
    await result.current.mutations.update({ expected_version: 1, title: 'Updated' });
  });
  expect(service.update).toHaveBeenCalledWith('test-access', itemId, {
    expected_version: 1,
    title: 'Updated',
  });
  let finish!: (value: ReturnType<typeof itemFixture>) => void;
  service.complete.mockImplementation(
    () =>
      new Promise((resolve) => {
        finish = resolve;
      }),
  );
  let pending: Promise<unknown>;
  act(() => {
    pending = result.current.mutations.complete(2);
  });
  await waitFor(() => expect(service.complete).toHaveBeenCalledTimes(1));
  expect(
    client.getQueryData<ReturnType<typeof itemFixture>>(planningKeys.item(accountA, itemId))
      ?.completed_at,
  ).toBeNull();
  await act(async () => {
    finish(itemFixture({ version: 3, is_priority: false, completed_at: '2026-10-02T15:00:00Z' }));
    await pending;
  });
  expect(
    client.getQueryData<ReturnType<typeof itemFixture>>(planningKeys.item(accountA, itemId))
      ?.version,
  ).toBe(3);
});
test('state conflict fetches current item and blocks until explicit review', async () => {
  const { service, wrapper } = setup();
  service.update.mockRejectedValueOnce(
    new ApiError('http', 'Conflict', { status: 409, code: 'plan_item_state_conflict' }),
  );
  service.get.mockResolvedValue(itemFixture({ version: 4 }));
  const { result } = renderHook(() => usePlanMutations(itemId), { wrapper });
  await act(async () => {
    await result.current.update({ expected_version: 1, title: 'Draft' });
  });
  expect(result.current.reviewRequired).toBe(true);
  expect(result.current.reviewReady).toBe(true);
  await act(async () => {
    await result.current.update({ expected_version: 4, title: 'Draft' });
  });
  expect(service.update).toHaveBeenCalledTimes(1);
  act(() => result.current.acknowledgeReview());
  await act(async () => {
    await result.current.update({ expected_version: 4, title: 'Draft' });
  });
  expect(service.update).toHaveBeenCalledTimes(2);
});
test('query retains confirmed data on failed refresh; explicit foreground refresh does not replay writes', async () => {
  const { service, wrapper } = setup();
  let foreground: ((state: AppStateStatus) => void) | undefined;
  const spy = jest.spyOn(AppState, 'addEventListener').mockImplementation((_type, listener) => {
    foreground = listener;
    return { remove: jest.fn() };
  });
  const { result } = renderHook(() => useToday(), { wrapper });
  await waitFor(() => expect(result.current.query.data).toBeDefined());
  service.today.mockRejectedValue(new ApiError('network', 'Offline'));
  await act(async () => {
    await result.current.refresh();
  });
  expect(result.current.query.data?.score.percentage).toBeNull();
  expect(result.current.query.isError).toBe(true);
  act(() => foreground?.('active'));
  await waitFor(() => expect(service.today).toHaveBeenCalledTimes(3));
  expect(service.create).not.toHaveBeenCalled();
  expect(service.complete).not.toHaveBeenCalled();
  spy.mockRestore();
});
test('account transitions discard feature queries and late confirmed writes cannot repopulate them', async () => {
  const { client, service, wrapper } = setup();
  client.setQueryData(planningKeys.item(accountA, itemId), itemFixture());
  const { result, rerender } = renderHook(() => usePlanMutations(), { wrapper });
  let finish!: (value: ReturnType<typeof itemFixture>) => void;
  service.create.mockImplementation(
    () =>
      new Promise((resolve) => {
        finish = resolve;
      }),
  );
  let pending: Promise<unknown>;
  act(() => {
    pending = result.current.create({
      title: 'Private draft',
      scheduled_for_date: '2026-10-02',
      timezone: 'UTC',
      is_priority: false,
    });
  });
  await waitFor(() => expect(service.create).toHaveBeenCalledTimes(1));
  mockState = { status: 'signedIn', account: { accountId: accountB, onboardingRequired: false } };
  rerender({});
  await act(async () => {
    finish(itemFixture());
    await pending;
  });
  expect(client.getQueryData(planningKeys.item(accountA, itemId))).toBeUndefined();
  expect(client.getQueryData(planningKeys.item(accountB, itemId))).toBeUndefined();
  expect(
    JSON.stringify(
      client
        .getQueryCache()
        .getAll()
        .map((q) => q.queryKey),
    ),
  ).not.toContain('Private');
});
test('account cleanup removes only the scoped feature cache, preserving unrelated capabilities', async () => {
  const { client } = setup();
  client.setQueryData(planningKeys.item(accountA, itemId), itemFixture());
  client.setQueryData(['auth', 'registration-policy'], { safe: true });
  await clearPlanningAccount(client, accountA);
  expect(client.getQueryData(planningKeys.item(accountA, itemId))).toBeUndefined();
  expect(client.getQueryData(['auth', 'registration-policy'])).toEqual({ safe: true });
});
test.each([
  [401, 'authentication_required'],
  [403, 'onboarding_required'],
] as const)('read recovery %s uses existing session workflow', async (status, code) => {
  const { service, wrapper } = setup();
  service.today.mockRejectedValue(new ApiError('http', 'Unsafe server prose', { status, code }));
  renderHook(() => useToday(), { wrapper });
  await waitFor(() => expect(status === 401 ? mockClear : mockRefreshSession).toHaveBeenCalled());
});

test('day and timezone boundary checks refetch reads only and keep confirmed old-zone content', async () => {
  const zone = jest.spyOn(time, 'resolveTimeZone').mockReturnValue('America/New_York');
  const marker = jest.spyOn(time, 'boundaryMarker').mockReturnValue('America/New_York:2026-10-02');
  const { service, wrapper } = setup();
  let foreground: ((state: AppStateStatus) => void) | undefined;
  jest.spyOn(AppState, 'addEventListener').mockImplementation((_type, listener) => {
    foreground = listener;
    return { remove: jest.fn() };
  });
  const { result } = renderHook(() => useToday(), { wrapper });
  await waitFor(() => expect(result.current.confirmedData).toBeDefined());
  marker.mockReturnValue('America/New_York:2026-10-03');
  act(() => foreground?.('active'));
  await waitFor(() => expect(service.today).toHaveBeenCalledTimes(2));
  zone.mockReturnValue('Asia/Tokyo');
  marker.mockReturnValue('Asia/Tokyo:2026-10-03');
  service.today.mockRejectedValueOnce(new ApiError('network', 'Failed read'));
  act(() => foreground?.('active'));
  await waitFor(() => expect(result.current.query.isError).toBe(true));
  expect(service.today.mock.calls[2]?.[1]).toBe('Asia/Tokyo');
  expect(result.current.confirmedData?.timezone).toBe('America/New_York');
  expect(service.create).not.toHaveBeenCalled();
  expect(service.complete).not.toHaveBeenCalled();
});

test('known offline actions never send or queue a mutation for reconnect', async () => {
  const { service, wrapper } = setup();
  mockConnectivity = 'offline';
  const { result, rerender } = renderHook(() => usePlanMutations(itemId), { wrapper });
  await act(async () => {
    await result.current.complete(1);
  });
  expect(service.complete).not.toHaveBeenCalled();
  expect(result.current.failure?.kind).toBe('offline');
  mockConnectivity = 'online';
  rerender({});
  expect(service.complete).not.toHaveBeenCalled();
});

test('account transition clears unsaved presentation drafts as well as the query scope', () => {
  const { wrapper } = setup();
  const { result, rerender } = renderHook(() => usePlanning(), { wrapper });
  const previous = result.current.drafts;
  previous.set('create', {
    values: {
      title: 'Private unsaved title',
      date: '2026-10-02',
      timezone: 'UTC',
      scheduled: false,
      start: '',
      end: '',
      priority: false,
    },
  });
  mockState = { status: 'signedIn', account: { accountId: accountB, onboardingRequired: false } };
  rerender({});
  expect(previous.size).toBe(0);
  expect(result.current.drafts.size).toBe(0);
  expect(result.current.drafts).not.toBe(previous);
});

test('confirmed rescheduling resets old and new selected-date pages, while session cleanup removes Plan', async () => {
  const { client, service, wrapper } = setup();
  const oldKey = planningKeys.plan(accountA, '2026-10-02', 'UTC'),
    newKey = planningKeys.plan(accountA, '2026-10-03', 'UTC');
  client.setQueryData(oldKey, {
    pages: [{ page: { next_cursor: 'opaque-old' } }],
    pageParams: [undefined],
  });
  client.setQueryData(newKey, {
    pages: [{ page: { next_cursor: 'opaque-new' } }],
    pageParams: [undefined],
  });
  service.update.mockResolvedValue(itemFixture({ scheduled_for_date: '2026-10-03', version: 2 }));
  const { result } = renderHook(() => usePlanMutations(itemId), { wrapper });
  await act(async () => {
    await result.current.update({ expected_version: 1, scheduled_for_date: '2026-10-03' });
  });
  expect(client.getQueryData(oldKey)).toBeUndefined();
  expect(client.getQueryData(newKey)).toBeUndefined();
  client.setQueryData(oldKey, { safe: true });
  await act(async () => {
    await clearPlanningAccount(client, accountA);
  });
  expect(client.getQueryData(oldKey)).toBeUndefined();
});
