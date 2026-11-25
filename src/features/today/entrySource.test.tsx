import { act, render, renderHook } from '@testing-library/react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { ReactNode } from 'react';
import { createCreationCoordinator } from './creation';
import { itemFixture } from './testFixtures';
import { usePlanMutations } from './usePlanMutations';
import { usePlanAction } from './usePlanAction';

const mockCreate = jest.fn();
const mockNavigate = jest.fn();
jest.mock('./PlanningProvider', () => ({
  planningKeys: {
    account: (account: string) => ['daily-planning', account],
    item: (account: string, id: string) => ['daily-planning', account, 'item', id],
  },
  usePlanning: () => ({
    account: 'a',
    service: { create: (...args: unknown[]) => mockCreate(...args) },
    creation: mockCreation,
    credential: () => 'token',
    current: () => true,
    recover: jest.fn().mockResolvedValue(undefined),
  }),
}));
jest.mock('@/features/auth/integration/useConnectivity', () => ({
  useAuthenticationConnectivity: () => 'online',
}));
jest.mock('@/features/app-shell/useShellDestination', () => ({
  useShellDestination: () => mockNavigate,
}));
jest.mock('@/navigation', () => ({ routes: { app: { planItemNew: '/plan-item-new' } } }));
let mockCreation = createCreationCoordinator();

const payload = {
  title: 'Call mom',
  scheduled_for_date: '2026-10-02',
  timezone: 'America/New_York',
  scheduled_start_at: null,
  scheduled_end_at: null,
  is_priority: false,
};

const client = new QueryClient({
  defaultOptions: { queries: { retry: false, gcTime: 0 }, mutations: { gcTime: 0 } },
});
function wrapper({ children }: { children: ReactNode }) {
  return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
}
afterEach(() => client.clear());

beforeEach(() => {
  jest.clearAllMocks();
  mockCreation = createCreationCoordinator();
  mockCreate.mockResolvedValue(itemFixture());
});

describe('entry source on the existing creates', () => {
  it('the manual form sends manual by default', async () => {
    const { result } = renderHook(() => usePlanMutations(), { wrapper });
    await act(async () => {
      await result.current.create(payload);
    });
    expect(mockCreate).toHaveBeenCalledWith('token', payload, expect.any(String), {
      entrySource: 'manual',
    });
  });

  it('Quick Log sends quick_log', async () => {
    const { result } = renderHook(() => usePlanMutations(undefined, { entrySource: 'quick_log' }), {
      wrapper,
    });
    await act(async () => {
      await result.current.create(payload);
    });
    expect(mockCreate.mock.calls[0]?.[3]).toEqual({ entrySource: 'quick_log' });
  });

  it('does not change the payload or the idempotency key behavior', async () => {
    mockCreate.mockRejectedValueOnce(Object.assign(new Error('x'), {}));
    const { result } = renderHook(() => usePlanMutations(undefined, { entrySource: 'quick_log' }), {
      wrapper,
    });
    await act(async () => {
      await result.current.create(payload);
    });
    await act(async () => {
      await result.current.create(payload);
    });
    expect(mockCreate.mock.calls[0]?.[1]).toEqual(mockCreate.mock.calls[1]?.[1]);
  });
});

describe('the origin marker carried to the create form', () => {
  function Probe({ entry }: { entry?: 'quick_log' }) {
    const open = usePlanAction(undefined, entry);
    open('plan_item.create');
    return null;
  }

  it('Quick Log passes only a content-free origin marker', () => {
    render(<Probe entry="quick_log" />);
    expect(mockNavigate).toHaveBeenCalledWith({
      pathname: '/plan-item-new',
      params: { entry: 'quick_log' },
    });
  });

  it('other entry points keep the plain route', () => {
    render(<Probe />);
    expect(mockNavigate).toHaveBeenCalledWith('/plan-item-new');
  });
});
