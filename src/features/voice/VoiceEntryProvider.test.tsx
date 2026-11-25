import { act, fireEvent, render, screen } from '@testing-library/react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AppState, Linking, Platform } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { ThemeProvider } from '@/design-system/theme';
import { itemFixture } from '@/features/today/testFixtures';
import type { PlanItem } from '@/features/today/types';
import { ApiError } from '@/api';
import type { FeatureFlagService } from './featureFlags';
import { takeVoicePrefill } from './prefill';
import { fakeNative } from './testSupport';
import { VoiceEntryButton } from './VoiceEntryButton';
import { VoiceEntryProvider } from './VoiceEntryProvider';
import type { VoiceExplainerStorage } from './explainerStorage';

const mockNavigate = jest.fn();
jest.mock('expo-router', () => ({ useRouter: () => ({ navigate: mockNavigate }) }));
jest.mock('expo-haptics', () => ({
  impactAsync: jest.fn().mockResolvedValue(undefined),
  notificationAsync: jest.fn().mockResolvedValue(undefined),
  ImpactFeedbackStyle: { Light: 'light', Medium: 'medium' },
  NotificationFeedbackType: { Success: 'success' },
}));
jest.mock('@/navigation', () => ({
  routes: { app: { index: '/', planItemNew: '/plan-item-new', planItem: '/plan-item' } },
}));
jest.mock('@/features/auth/integration/useConnectivity', () => ({
  useAuthenticationConnectivity: () => 'online',
}));
jest.mock('@/features/today/NativePicker', () => ({ NativePicker: () => null }));

const ACCOUNT = '10000000-0000-4000-8000-000000000001';
let mockAccount = ACCOUNT;
let mockCurrent = true;
const mockCreate = jest.fn();
jest.mock('@/features/today/PlanningProvider', () => ({
  planningRoot: ['daily-planning'],
  planningKeys: {
    account: (account: string) => ['daily-planning', account],
    item: (account: string, id: string) => ['daily-planning', account, 'item', id],
  },
  usePlanning: () => ({
    account: mockAccount,
    service: { create: (...args: unknown[]) => mockCreate(...args) },
    credential: () => 'token',
    current: () => mockCurrent,
    recover: jest.fn().mockResolvedValue(undefined),
  }),
}));

const NY_NOW = new Date('2026-11-18T19:00:00.000Z');
const original = process.env.EXPO_PUBLIC_VOICE_ENABLED;
const originalOS = Platform.OS;
const clients: QueryClient[] = [];

function setup({
  server = async () => ({ voiceEntryEnabled: true }),
  nativeStatus = 'available',
  seen = true,
}: {
  server?: () => Promise<{ voiceEntryEnabled: boolean }>;
  nativeStatus?: string;
  seen?: boolean;
} = {}) {
  const fake = fakeNative();
  fake.native.getAvailability.mockResolvedValue({ status: nativeStatus });
  const featureService = { get: jest.fn(server) } as unknown as FeatureFlagService;
  const explainer: VoiceExplainerStorage & { write: jest.Mock } = {
    read: jest.fn().mockResolvedValue(seen),
    write: jest.fn().mockResolvedValue(undefined),
  };
  const client = new QueryClient({ defaultOptions: { queries: { retry: false, gcTime: 0 } } });
  clients.push(client);
  const tree = (key = 'a') => (
    <SafeAreaProvider
      initialMetrics={{
        frame: { x: 0, y: 0, width: 390, height: 844 },
        insets: { top: 47, right: 0, bottom: 34, left: 0 },
      }}
    >
      <ThemeProvider preference="light">
        <QueryClientProvider client={client}>
          <VoiceEntryProvider
            key={key}
            native={fake.native}
            featureService={featureService}
            explainerStorage={explainer}
          >
            <VoiceEntryButton entry="today" />
            <VoiceEntryButton entry="plan" contextDate="2026-12-05" kind="labeled" />
          </VoiceEntryProvider>
        </QueryClientProvider>
      </ThemeProvider>
    </SafeAreaProvider>
  );
  const view = render(tree());
  return { ...fake, featureService, explainer, view, tree, client };
}

async function flush() {
  await act(async () => {
    await jest.advanceTimersByTimeAsync(0);
  });
}

beforeEach(() => {
  jest.useFakeTimers({ now: NY_NOW });
  (AppState.addEventListener as jest.Mock).mockImplementation(() => ({ remove: jest.fn() }));
  process.env.EXPO_PUBLIC_VOICE_ENABLED = 'true';
  Platform.OS = 'ios';
  mockAccount = ACCOUNT;
  mockCurrent = true;
  mockNavigate.mockReset();
  mockCreate.mockReset();
  mockCreate.mockImplementation(async (_c: string, body: { title: string }): Promise<PlanItem> =>
    itemFixture({ title: body.title, scheduled_for_date: '2026-11-19' }),
  );
});
afterEach(() => {
  for (const client of clients.splice(0)) client.clear();
  jest.useRealTimers();
  takeVoicePrefill();
  if (original === undefined) delete process.env.EXPO_PUBLIC_VOICE_ENABLED;
  else process.env.EXPO_PUBLIC_VOICE_ENABLED = original;
  Platform.OS = originalOS;
});

describe('mic gating in the app (VX-21)', () => {
  it('shows the mic when every key is on', async () => {
    setup();
    await flush();
    expect(screen.getAllByLabelText('Add by voice')).toHaveLength(2);
  });

  it('shows nothing when the build flag is off', async () => {
    process.env.EXPO_PUBLIC_VOICE_ENABLED = 'false';
    const t = setup();
    await flush();
    expect(screen.queryByLabelText('Add by voice')).toBeNull();
    expect(t.featureService.get).not.toHaveBeenCalled();
  });

  it('shows nothing when the server flag is off', async () => {
    setup({ server: async () => ({ voiceEntryEnabled: false }) });
    await flush();
    expect(screen.queryByLabelText('Add by voice')).toBeNull();
  });

  it('shows nothing when the features request fails', async () => {
    setup({
      server: async () => {
        throw new ApiError('http', 'down', { status: 503 });
      },
    });
    await flush();
    expect(screen.queryByLabelText('Add by voice')).toBeNull();
  });

  it('shows nothing on Android', async () => {
    Platform.OS = 'android';
    setup();
    await flush();
    expect(screen.queryByLabelText('Add by voice')).toBeNull();
  });

  it('shows nothing when on-device speech is unavailable', async () => {
    setup({ nativeStatus: 'unsupported_os' });
    await flush();
    expect(screen.queryByLabelText('Add by voice')).toBeNull();
  });

  it('counts first use (permission not yet asked) as available', async () => {
    setup({ nativeStatus: 'permission_undetermined' });
    await flush();
    expect(screen.getAllByLabelText('Add by voice')).toHaveLength(2);
  });
});

describe('first use and the explainer', () => {
  it('shows the explainer first, remembers only a boolean, then listens', async () => {
    const t = setup({ seen: false });
    await flush();
    fireEvent.press(screen.getAllByLabelText('Add by voice')[0]!);
    expect(screen.getByText('Add a task by voice')).toBeTruthy();
    expect(t.native.requestPermissions).not.toHaveBeenCalled();
    fireEvent.press(screen.getByLabelText('Continue'));
    await flush();
    expect(t.explainer.write).toHaveBeenCalledTimes(1);
    expect(t.explainer.write).toHaveBeenCalledWith();
    expect(t.native.start).toHaveBeenCalledTimes(1);
  });

  it('skips the explainer when it was already seen', async () => {
    const t = setup({ seen: true });
    await flush();
    fireEvent.press(screen.getAllByLabelText('Add by voice')[0]!);
    await flush();
    expect(screen.queryByText('Add a task by voice')).toBeNull();
    expect(t.native.start).toHaveBeenCalledTimes(1);
  });

  it('Open Settings sends the person to iOS Settings', async () => {
    const t = setup();
    t.native.requestPermissions.mockResolvedValue({ microphone: 'denied', speech: 'denied' });
    const spy = jest.spyOn(Linking, 'openSettings').mockResolvedValue(undefined);
    await flush();
    fireEvent.press(screen.getAllByLabelText('Add by voice')[0]!);
    await flush();
    fireEvent.press(screen.getByLabelText('Open Settings'));
    expect(spy).toHaveBeenCalledTimes(1);
    spy.mockRestore();
  });
});

async function reachReview(t: ReturnType<typeof setup>, text: string, index = 0) {
  await flush();
  fireEvent.press(screen.getAllByLabelText('Add by voice')[index]!);
  await flush();
  act(() => {
    t.emit.listening();
    t.emit.final(text);
    t.emit.end('silence');
  });
  await flush();
}

describe('saving, toast and cache refresh', () => {
  it('closes the sheet and says Added to <date> with View, only after the server confirmed', async () => {
    const t = setup();
    const reset = jest.spyOn(t.client, 'resetQueries');
    const invalidate = jest.spyOn(t.client, 'invalidateQueries');
    const setData = jest.spyOn(t.client, 'setQueryData');
    await reachReview(t, 'Call mom tomorrow');
    expect(screen.queryByText(/Added to/)).toBeNull();
    fireEvent.press(screen.getByLabelText('Add'));
    await flush();
    expect(screen.getByText('Added to Thu, Nov 19')).toBeTruthy();
    expect(screen.queryByLabelText('Add')).toBeNull();
    fireEvent.press(screen.getByLabelText('View'));
    expect(mockNavigate).toHaveBeenCalledWith({
      pathname: '/plan-item',
      params: { id: expect.any(String) },
    });
    expect(reset).toHaveBeenCalledWith({ queryKey: ['daily-planning', ACCOUNT, 'plan'] });
    expect(setData).toHaveBeenCalledWith(
      ['daily-planning', ACCOUNT, 'item', itemFixture().id],
      expect.objectContaining({ title: 'Call mom' }),
    );
    expect(invalidate).toHaveBeenCalledWith({ queryKey: ['daily-planning', ACCOUNT, 'today'] });
  });

  it('says Added to Today when the item is for today', async () => {
    const t = setup();
    mockCreate.mockImplementation(async (_c: string, body: { title: string }) =>
      itemFixture({
        title: body.title,
        scheduled_for_date: '2026-11-18',
        timezone: 'America/New_York',
      }),
    );
    await reachReview(t, 'Call mom today');
    fireEvent.press(screen.getByLabelText('Add'));
    await flush();
    expect(screen.getByText('Added to Today')).toBeTruthy();
  });

  it('the toast goes away by itself', async () => {
    const t = setup();
    await reachReview(t, 'Call mom tomorrow');
    fireEvent.press(screen.getByLabelText('Add'));
    await flush();
    await act(async () => {
      await jest.advanceTimersByTimeAsync(6100);
    });
    expect(screen.queryByText(/Added to/)).toBeNull();
  });

  it('sends the create with entrySource voice and an 8 second timeout', async () => {
    const t = setup();
    await reachReview(t, 'Call mom tomorrow');
    fireEvent.press(screen.getByLabelText('Add'));
    await flush();
    expect(mockCreate).toHaveBeenCalledTimes(1);
    expect(mockCreate.mock.calls[0]?.[3]).toEqual({ entrySource: 'voice', timeoutMs: 8000 });
  });

  it('a 403 discards the card and shows the existing message', async () => {
    const t = setup();
    mockCreate.mockRejectedValue(new ApiError('http', 'no', { status: 403 }));
    await reachReview(t, 'Call mom tomorrow');
    fireEvent.press(screen.getByLabelText('Add'));
    await flush();
    expect(screen.getByText('Planning is unavailable for this account.')).toBeTruthy();
    expect(screen.queryByLabelText('Add')).toBeNull();
  });
});

describe('Type it instead (VX-23)', () => {
  it('opens the existing form pre-filled through the in-memory handoff, not route params', async () => {
    const t = setup();
    await reachReview(t, 'Workout tomorrow at 7 am');
    fireEvent.press(screen.getByLabelText('Cancel'));
    await flush();
    await reachReview(t, 'Gym at 7 and dentist at 3');
    fireEvent.press(screen.getByLabelText('Type it instead'));
    expect(mockNavigate).toHaveBeenCalledWith('/plan-item-new');
    expect(JSON.stringify(mockNavigate.mock.calls)).not.toMatch(/gym|dentist/i);
    expect(takeVoicePrefill()).toEqual({ title: 'Gym at 7 and dentist at 3' });
    expect(takeVoicePrefill()).toBeUndefined();
    expect(screen.queryByLabelText('Type it instead')).toBeNull();
  });

  it('from the review card the handoff carries what was understood', async () => {
    const t = setup();
    await reachReview(t, 'Urgent: workout tomorrow at 7 am');
    fireEvent.press(screen.getByLabelText('Type it instead'));
    expect(mockNavigate).toHaveBeenCalledWith('/plan-item-new');
    expect(takeVoicePrefill()).toEqual({
      title: 'Workout',
      date: '2026-11-19',
      scheduled: true,
      start: '2026-11-19T07:00:00-05:00',
      end: '',
      priority: true,
    });
    expect(mockCreate).not.toHaveBeenCalled();
  });

  it('from Plan the form opens on the selected date', async () => {
    const t = setup();
    await reachReview(t, 'Yesterday call Sam', 1);
    fireEvent.press(screen.getByLabelText('Type it instead'));
    expect(mockNavigate).toHaveBeenCalledWith({
      pathname: '/plan-item-new',
      params: { origin: 'plan', selectedDate: '2026-12-05' },
    });
    expect(takeVoicePrefill()).toEqual({ title: 'Yesterday call Sam' });
  });
});

describe('purge on sign-out and account change (VX-17)', () => {
  it('forgets the card, the words and the handoff when the account changes', async () => {
    const t = setup();
    await reachReview(t, 'Workout tomorrow at 7 am');
    expect(screen.getByDisplayValue('Workout')).toBeTruthy();
    mockAccount = '10000000-0000-4000-8000-000000000002';
    t.view.rerender(t.tree('b'));
    await flush();
    expect(screen.queryByDisplayValue('Workout')).toBeNull();
    expect(screen.queryByLabelText('Add')).toBeNull();
    expect(takeVoicePrefill()).toBeUndefined();
  });

  it('cancels the microphone when the provider goes away mid-listening', async () => {
    const t = setup();
    await flush();
    fireEvent.press(screen.getAllByLabelText('Add by voice')[0]!);
    await flush();
    act(() => t.emit.listening());
    t.view.unmount();
    expect(t.native.cancel).toHaveBeenCalled();
  });

  it('a save that returns after sign-out never shows a toast', async () => {
    const t = setup();
    let resolve: (item: PlanItem) => void = () => undefined;
    mockCreate.mockImplementation(() => new Promise<PlanItem>((r) => (resolve = r)));
    await reachReview(t, 'Call mom tomorrow');
    fireEvent.press(screen.getByLabelText('Add'));
    await flush();
    mockCurrent = false;
    t.view.unmount();
    await act(async () => {
      resolve(itemFixture());
      await jest.advanceTimersByTimeAsync(0);
    });
    expect(t.view.toJSON()).toBeNull();
    expect(mockNavigate).not.toHaveBeenCalled();
  });
});

describe('no words in the logs or in storage (VX-18, D11, D15)', () => {
  it('a full session leaves nothing in console output or AsyncStorage but the explainer flag', async () => {
    const spies = (['log', 'info', 'warn', 'error', 'debug'] as const).map((method) =>
      jest.spyOn(console, method).mockImplementation(() => undefined),
    );
    const AsyncStorage = jest.requireMock('@react-native-async-storage/async-storage');
    const setItem = jest.spyOn(AsyncStorage, 'setItem');
    const t = setup({ seen: false });
    await flush();
    fireEvent.press(screen.getAllByLabelText('Add by voice')[0]!);
    fireEvent.press(screen.getByLabelText('Continue'));
    await flush();
    act(() => {
      t.emit.listening();
      t.emit.final('Zebra yoga tomorrow at 7 am');
      t.emit.end('silence');
    });
    await flush();
    fireEvent.press(screen.getByLabelText('Add'));
    await flush();
    const output = spies
      .flatMap((spy) => spy.mock.calls)
      .map((args) => args.map(String).join(' '))
      .join('\n');
    expect(output).not.toMatch(/zebra|yoga/i);
    expect(JSON.stringify(setItem.mock.calls)).not.toMatch(/zebra|yoga/i);
    for (const spy of spies) spy.mockRestore();
    setItem.mockRestore();
  });
});
