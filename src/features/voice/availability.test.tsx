import { act, render, waitFor } from '@testing-library/react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AppState, Platform, Text } from 'react-native';
import {
  VoiceAvailabilityProvider,
  decideVoiceAvailability,
  useVoiceAvailability,
  type VoiceNative,
} from './availability';
import type { FeatureFlagService } from './featureFlags';

const clients: QueryClient[] = [];
afterEach(() => {
  for (const client of clients.splice(0)) client.clear();
});

const mockAccount = '10000000-0000-4000-8000-000000000001';
jest.mock('@/features/today/PlanningProvider', () => ({
  planningRoot: ['daily-planning'],
  planningKeys: {
    account: (account: string) => ['daily-planning', account],
  },
  usePlanning: () => ({ account: mockAccount, credential: () => 'token' }),
}));

function Probe() {
  const { enabled, reason } = useVoiceAvailability();
  return <Text testID="probe">{enabled ? 'on' : `off:${reason ?? 'hidden'}`}</Text>;
}

function fakeNative(status: string): VoiceNative {
  return {
    getAvailability: jest.fn().mockResolvedValue({ status }),
    requestPermissions: jest.fn(),
    start: jest.fn(),
    stop: jest.fn(),
    cancel: jest.fn(),
    onStateChange: jest.fn(),
    onPartial: jest.fn(),
    onFinal: jest.fn(),
    onEnd: jest.fn(),
  } as unknown as VoiceNative;
}

function setup({
  server,
  native = 'available',
}: {
  server: () => Promise<{ voiceEntryEnabled: boolean }>;
  native?: string;
}) {
  const featureService = { get: jest.fn(server) } as unknown as FeatureFlagService;
  const client = new QueryClient({ defaultOptions: { queries: { retry: false, gcTime: 0 } } });
  clients.push(client);
  const nativeVoice = fakeNative(native);
  const view = render(
    <QueryClientProvider client={client}>
      <VoiceAvailabilityProvider featureService={featureService} native={nativeVoice}>
        <Probe />
      </VoiceAvailabilityProvider>
    </QueryClientProvider>,
  );
  return { view, featureService, native: nativeVoice, client };
}

const text = (view: ReturnType<typeof render>) => view.getByTestId('probe').props.children;
const original = process.env.EXPO_PUBLIC_VOICE_ENABLED;
const originalOS = Platform.OS;
beforeEach(() => {
  // RN's jest preset already mocks AppState.addEventListener; give it a safe default each test.
  (AppState.addEventListener as jest.Mock).mockImplementation(() => ({ remove: jest.fn() }));
  process.env.EXPO_PUBLIC_VOICE_ENABLED = 'true';
  Platform.OS = 'ios';
});
afterEach(() => {
  if (original === undefined) delete process.env.EXPO_PUBLIC_VOICE_ENABLED;
  else process.env.EXPO_PUBLIC_VOICE_ENABLED = original;
  Platform.OS = originalOS;
});

describe('decideVoiceAvailability (VX-21)', () => {
  const on = {
    buildFlag: true,
    serverFlag: true,
    platform: 'ios',
    nativeStatus: 'available' as const,
  };
  it('is enabled only when all four keys are on', () => {
    expect(decideVoiceAvailability(on)).toEqual({ enabled: true });
    expect(decideVoiceAvailability({ ...on, buildFlag: false }).enabled).toBe(false);
    expect(decideVoiceAvailability({ ...on, serverFlag: false }).enabled).toBe(false);
    expect(decideVoiceAvailability({ ...on, platform: 'android' }).enabled).toBe(false);
    expect(decideVoiceAvailability({ ...on, nativeStatus: 'unsupported_os' }).enabled).toBe(false);
  });
  it('counts permission_undetermined as available but nothing else', () => {
    expect(
      decideVoiceAvailability({ ...on, nativeStatus: 'permission_undetermined' }).enabled,
    ).toBe(true);
    for (const status of [
      'unsupported_platform',
      'unsupported_os',
      'unsupported_locale',
      'model_not_installed',
      'permission_denied',
      'restricted',
    ] as const)
      expect(decideVoiceAvailability({ ...on, nativeStatus: status })).toEqual({
        enabled: false,
        reason: `native_${status}`,
      });
  });
  it('stays off while a key is still unknown', () => {
    expect(decideVoiceAvailability({ ...on, serverFlag: undefined }).enabled).toBe(false);
    expect(decideVoiceAvailability({ ...on, nativeStatus: undefined }).enabled).toBe(false);
  });
});

describe('VoiceAvailabilityProvider', () => {
  it('shows the mic only when build, server, platform and native are all on', async () => {
    const view = setup({ server: async () => ({ voiceEntryEnabled: true }) }).view;
    await waitFor(() => expect(text(view)).toBe('on'));
  });

  it('is off without the build flag and never even asks the server', async () => {
    process.env.EXPO_PUBLIC_VOICE_ENABLED = 'false';
    const { view, featureService, native } = setup({
      server: async () => ({ voiceEntryEnabled: true }),
    });
    expect(text(view)).toBe('off:build_flag_off');
    await act(async () => undefined);
    expect(featureService.get).not.toHaveBeenCalled();
    expect(native.getAvailability).not.toHaveBeenCalled();
  });

  it('is off when the server flag is off', async () => {
    const view = setup({ server: async () => ({ voiceEntryEnabled: false }) }).view;
    await waitFor(() => expect(text(view)).toBe('off:server_flag_off'));
  });

  it('is off on Android and never asks the server', async () => {
    Platform.OS = 'android';
    const { view, featureService } = setup({ server: async () => ({ voiceEntryEnabled: true }) });
    await act(async () => undefined);
    expect(text(view)).toBe('off:build_flag_off'.replace('build_flag_off', 'unsupported_platform'));
    expect(featureService.get).not.toHaveBeenCalled();
  });

  it('is off when the device cannot do on-device speech', async () => {
    const view = setup({
      server: async () => ({ voiceEntryEnabled: true }),
      native: 'model_not_installed',
    }).view;
    await waitFor(() => expect(text(view)).toBe('off:native_model_not_installed'));
  });

  it('treats permission_undetermined as available', async () => {
    const view = setup({
      server: async () => ({ voiceEntryEnabled: true }),
      native: 'permission_undetermined',
    }).view;
    await waitFor(() => expect(text(view)).toBe('on'));
  });

  it('fails closed when the features request errors', async () => {
    const view = setup({
      server: async () => {
        throw new Error('offline');
      },
    }).view;
    await waitFor(() => expect(text(view)).toBe('off:server_flag_off'));
  });

  it('fails closed when the response has an unknown shape', async () => {
    const view = setup({
      server: async () => {
        throw new Error('invalid shape');
      },
    }).view;
    await waitFor(() => expect(text(view)).toBe('off:server_flag_off'));
  });

  it('refetches the flag and the native status when the app returns to the foreground', async () => {
    const listeners: Array<(state: string) => void> = [];
    (AppState.addEventListener as jest.Mock).mockImplementation(((
      _type: string,
      handler: (state: string) => void,
    ) => {
      listeners.push(handler);
      return { remove: jest.fn() };
    }) as never);
    const { featureService, native, view } = setup({
      server: async () => ({ voiceEntryEnabled: true }),
    });
    await waitFor(() => expect(text(view)).toBe('on'));
    const calls = (featureService.get as jest.Mock).mock.calls.length;
    const nativeCalls = (native.getAvailability as jest.Mock).mock.calls.length;
    await act(async () => listeners.forEach((listener) => listener('active')));
    await waitFor(() =>
      expect((featureService.get as jest.Mock).mock.calls.length).toBeGreaterThan(calls),
    );
    expect((native.getAvailability as jest.Mock).mock.calls.length).toBeGreaterThan(nativeCalls);
  });

  it('refetches the flag when a Today query succeeds again', async () => {
    const { featureService, client, view } = setup({
      server: async () => ({ voiceEntryEnabled: true }),
    });
    await waitFor(() => expect(text(view)).toBe('on'));
    const calls = (featureService.get as jest.Mock).mock.calls.length;
    act(() => {
      client.setQueryData(['daily-planning', mockAccount, 'today', 'UTC'], { ok: true });
    });
    await waitFor(() =>
      expect((featureService.get as jest.Mock).mock.calls.length).toBeGreaterThan(calls),
    );
  });

  it('does not refetch the flag for another account or another query', async () => {
    const { featureService, client, view } = setup({
      server: async () => ({ voiceEntryEnabled: true }),
    });
    await waitFor(() => expect(text(view)).toBe('on'));
    const calls = (featureService.get as jest.Mock).mock.calls.length;
    act(() => {
      client.setQueryData(['daily-planning', 'someone-else', 'today', 'UTC'], { ok: true });
      client.setQueryData(['daily-planning', mockAccount, 'plan', '2026-10-02', 'UTC'], { ok: 1 });
    });
    await act(async () => undefined);
    expect((featureService.get as jest.Mock).mock.calls.length).toBe(calls);
  });

  it('is off outside a provider', () => {
    const view = render(<Probe />);
    expect(text(view)).toBe('off:checking');
  });
});
