import { act, renderHook, waitFor } from '@testing-library/react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { ReactNode } from 'react';
import { usePlanDate } from './usePlanDate';
import { planFixture, dayItem } from './testFixtures';
import type { PlanDateResource } from './validation';
import { ApiError } from '@/api';
const mockRead = jest.fn(),
  mockRecover = jest.fn();
let mockAccount = 'account-a',
  mockOnline = true;
jest.mock('expo-router', () => ({ useFocusEffect: () => {} }));
jest.mock('@/features/today/PlanningProvider', () => ({
  planningKeys: {
    plan: (account: string, date: string, zone: string) => [
      'daily-planning',
      account,
      'plan',
      date,
      zone,
    ],
  },
  usePlanning: () => ({
    account: mockAccount,
    credential: () => 'synthetic-access',
    current: () => true,
    recover: mockRecover,
    service: { selectedDate: mockRead },
  }),
}));
jest.mock('@/features/auth/integration/useConnectivity', () => ({
  useAuthenticationConnectivity: () => (mockOnline ? 'online' : 'offline'),
}));
const clients: QueryClient[] = [];
function setup() {
  const client = new QueryClient();
  clients.push(client);
  const wrapper = ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={client}>{children}</QueryClientProvider>
  );
  return { client, wrapper };
}
beforeEach(() => {
  jest.clearAllMocks();
  mockAccount = 'account-a';
  mockOnline = true;
  mockRead.mockResolvedValue(planFixture());
});
afterEach(() => {
  clients.splice(0).forEach((client) => client.clear());
});
test('late date response cannot render under a newer selected date', async () => {
  const { wrapper } = setup();
  let finish!: (value: PlanDateResource) => void;
  mockRead
    .mockImplementationOnce(
      () =>
        new Promise((resolve) => {
          finish = resolve;
        }),
    )
    .mockResolvedValue(planFixture('2026-10-03'));
  const { result, rerender } = renderHook(
    ({ date }: { date: string }) => usePlanDate(date, 'America/New_York'),
    {
      wrapper,
      initialProps: { date: '2026-10-02' },
    },
  );
  await waitFor(() => expect(mockRead).toHaveBeenCalledTimes(1));
  rerender({ date: '2026-10-03' });
  expect(result.current.data).toBeUndefined();
  await waitFor(() => expect(result.current.data?.selected_date).toBe('2026-10-03'));
  await act(async () => finish(planFixture('2026-10-02')));
  expect(result.current.data?.selected_date).toBe('2026-10-03');
});
test('pagination deduplicates backend order, blocks repeated intents and restarts after invalid cursor', async () => {
  const { wrapper } = setup();
  const first = planFixture(undefined, [dayItem()]);
  first.summary.total = 2;
  first.summary.remaining = 2;
  first.summary.unscheduled_remaining = 2;
  first.page = { limit: 50, next_cursor: 'opaque-next', has_more: true };
  mockRead.mockResolvedValueOnce(first);
  const { result } = renderHook(() => usePlanDate('2026-10-02', 'America/New_York'), { wrapper });
  await waitFor(() => expect(result.current.data).toBeDefined());
  let finish!: (value: PlanDateResource) => void;
  mockRead.mockImplementationOnce(
    () =>
      new Promise((resolve) => {
        finish = resolve;
      }),
  );
  let pending!: Promise<unknown>;
  act(() => {
    pending = result.current.loadMore();
    void result.current.loadMore();
  });
  await waitFor(() => expect(mockRead).toHaveBeenCalledTimes(2));
  const next = planFixture(undefined, [
    dayItem(),
    dayItem({ id: '00000000-0000-4000-8000-000000000022' }),
  ]);
  next.summary = first.summary;
  await act(async () => {
    finish(next);
    await pending;
  });
  await waitFor(() => expect(result.current.items).toHaveLength(2));
  mockRead.mockRejectedValueOnce(new ApiError('http', 'private-cursor', { status: 503 }));
  await act(async () => {
    await result.current.refresh();
  });
  expect(result.current.data?.summary.total).toBe(2);
  await waitFor(() => expect(result.current.query.isError).toBe(true));
  mockRead.mockResolvedValueOnce(first);
  await act(async () => {
    await result.current.refresh();
  });
  await waitFor(() => {
    expect(result.current.query.isError).toBe(false);
    expect(result.current.query.isFetching).toBe(false);
  });
  mockRead.mockRejectedValueOnce(new ApiError('http', 'private-cursor', { status: 422 }));
  await act(async () => {
    await result.current.loadMore();
  });
  await waitFor(() => expect(result.current.query.isFetchNextPageError).toBe(true));
  mockRead.mockResolvedValueOnce(first);
  await act(async () => {
    await result.current.refresh();
  });
  expect(mockRead.mock.calls.at(-1)?.[3]).toBeUndefined();
  expect(result.current.query.data?.pages).toHaveLength(1);
});
test('offline does not send reads or reconnect writes; account switch has no placeholder data', async () => {
  const { wrapper } = setup();
  const { result, rerender } = renderHook(() => usePlanDate('2026-10-02', 'America/New_York'), {
    wrapper,
  });
  await waitFor(() => expect(result.current.data).toBeDefined());
  mockOnline = false;
  rerender({});
  await act(async () => {
    await result.current.loadMore();
    await result.current.refresh();
  });
  expect(mockRead).toHaveBeenCalledTimes(1);
  mockAccount = 'account-b';
  rerender({});
  expect(result.current.data).toBeUndefined();
});
