import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { AppState, Platform } from 'react-native';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { isVoiceBuildEnabled } from '@/config/env';
import { usePlanning, planningKeys } from '@/features/today/PlanningProvider';
import { planningQueryPolicy } from '@/features/today/useToday';
import {
  defaultFeatureFlagService,
  featureFlagKeys,
  type FeatureFlagService,
} from './featureFlags';
import * as nativeVoice from './native';
import type { VoiceAvailabilityStatus } from './native';

/** The slice of the native module this feature uses; tests pass a fake. */
export type VoiceNative = Pick<
  typeof nativeVoice,
  | 'getAvailability'
  | 'requestPermissions'
  | 'start'
  | 'stop'
  | 'cancel'
  | 'onStateChange'
  | 'onPartial'
  | 'onFinal'
  | 'onEnd'
>;
export const defaultVoiceNative: VoiceNative = nativeVoice;

export type VoiceUnavailableReason =
  | 'build_flag_off'
  | 'unsupported_platform'
  | 'server_flag_off'
  | 'checking'
  | `native_${VoiceAvailabilityStatus}`;

export type VoiceAvailabilityDecision = { enabled: boolean; reason?: VoiceUnavailableReason };

/** Pure gate: ALL four keys must be on. `permission_undetermined` counts as available. */
export function decideVoiceAvailability(input: {
  buildFlag: boolean;
  serverFlag: boolean | undefined;
  platform: string;
  nativeStatus: VoiceAvailabilityStatus | undefined;
}): VoiceAvailabilityDecision {
  if (!input.buildFlag) return { enabled: false, reason: 'build_flag_off' };
  if (input.platform !== 'ios') return { enabled: false, reason: 'unsupported_platform' };
  if (input.serverFlag === undefined) return { enabled: false, reason: 'checking' };
  if (!input.serverFlag) return { enabled: false, reason: 'server_flag_off' };
  if (input.nativeStatus === undefined) return { enabled: false, reason: 'checking' };
  if (input.nativeStatus !== 'available' && input.nativeStatus !== 'permission_undetermined')
    return { enabled: false, reason: `native_${input.nativeStatus}` };
  return { enabled: true };
}

const disabled: VoiceAvailabilityDecision = { enabled: false, reason: 'checking' };
type AvailabilityContext = { decision: VoiceAvailabilityDecision; refresh: () => void };
const Context = createContext<AvailabilityContext>({
  decision: disabled,
  refresh: () => undefined,
});

/** Re-reads the native status, for example after a permission prompt was answered. */
export function useVoiceAvailabilityRefresh(): () => void {
  return useContext(Context).refresh;
}

/**
 * Whether the mic may be shown. The reason code is exposed in development builds only.
 * Outside a provider (or on any error) voice is off.
 */
export function useVoiceAvailability(): VoiceAvailabilityDecision {
  const { decision: value } = useContext(Context);
  return __DEV__ || value.enabled ? value : { enabled: value.enabled };
}

export function VoiceAvailabilityProvider({
  children,
  featureService = defaultFeatureFlagService,
  native = defaultVoiceNative,
}: {
  children: ReactNode;
  featureService?: FeatureFlagService;
  native?: VoiceNative;
}) {
  const planning = usePlanning();
  const client = useQueryClient();
  const buildFlag = isVoiceBuildEnabled();
  const ios = Platform.OS === 'ios';
  const eligible = buildFlag && ios;

  const query = useQuery({
    ...planningQueryPolicy,
    queryKey: featureFlagKeys.account(planning.account),
    enabled: eligible,
    queryFn: ({ signal }) => featureService.get(planning.credential(), signal),
  });
  const refetch = useRef(query.refetch);
  refetch.current = query.refetch;

  // Refetch when the app returns to the foreground and whenever Today is refetched.
  useEffect(() => {
    if (!eligible) return;
    const subscription = AppState.addEventListener('change', (state) => {
      if (state === 'active') void refetch.current({ cancelRefetch: false });
    });
    const todayPrefix = [...planningKeys.account(planning.account), 'today'];
    const unsubscribe = client.getQueryCache().subscribe((event) => {
      if (
        event.type === 'updated' &&
        event.action.type === 'success' &&
        todayPrefix.every((part, index) => event.query.queryKey[index] === part)
      )
        void refetch.current({ cancelRefetch: false });
    });
    return () => {
      subscription.remove();
      unsubscribe();
    };
  }, [client, eligible, planning.account]);

  const [nativeStatus, setNativeStatus] = useState<VoiceAvailabilityStatus>();
  const refreshNative = useCallback(async () => {
    try {
      const result = await native.getAvailability();
      setNativeStatus(result.status);
    } catch {
      setNativeStatus('unsupported_platform');
    }
  }, [native]);
  useEffect(() => {
    if (!eligible) return;
    void refreshNative();
    const subscription = AppState.addEventListener('change', (state) => {
      if (state === 'active') void refreshNative();
    });
    return () => subscription.remove();
  }, [eligible, refreshNative]);

  // Fail closed: any error, or the last fetch having failed, means voice is off.
  const serverFlag = !eligible
    ? undefined
    : query.isError
      ? false
      : (query.data?.voiceEntryEnabled ?? undefined);

  const decision = useMemo(
    () =>
      decideVoiceAvailability({
        buildFlag,
        serverFlag: query.isError ? false : serverFlag,
        platform: Platform.OS,
        nativeStatus,
      }),
    [buildFlag, serverFlag, query.isError, nativeStatus],
  );
  const value = useMemo(
    () => ({ decision, refresh: () => void refreshNative() }),
    [decision, refreshNative],
  );
  return <Context.Provider value={value}>{children}</Context.Provider>;
}
