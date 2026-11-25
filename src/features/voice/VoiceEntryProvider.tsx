import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
  type ReactNode,
} from 'react';
import { AccessibilityInfo, AppState, Linking } from 'react-native';
import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';
import { useQueryClient } from '@tanstack/react-query';
import { routes } from '@/navigation';
import { useAuthenticationConnectivity } from '@/features/auth/integration/useConnectivity';
import { planningKeys, usePlanning } from '@/features/today/PlanningProvider';
import { localDate } from '@/features/today/time';
import {
  VoiceAvailabilityProvider,
  defaultVoiceNative,
  useVoiceAvailabilityRefresh,
  type VoiceNative,
} from './availability';
import { savedToast } from './copy';
import { defaultFeatureFlagService, type FeatureFlagService } from './featureFlags';
import { setVoicePrefill } from './prefill';
import { voiceExplainerStorage, type VoiceExplainerStorage } from './explainerStorage';
import { createVoiceSessionController, type VoiceSessionController } from './session/controller';
import { isActive } from './session/reducer';
import type { VoiceEntryPoint } from './session/types';
import { VoiceSheet } from './sheet/VoiceSheet';
import { VoiceToast, type VoiceToastValue } from './sheet/VoiceToast';

export type VoiceEntryValue = {
  /** Opens the shared sheet. Resumes the current session instead of starting a second one. */
  open: (entry: VoiceEntryPoint, contextDate: string) => void;
};

const Context = createContext<VoiceEntryValue | undefined>(undefined);

/** Undefined outside a provider, in which case no entry point is shown. */
export function useVoiceEntry(): VoiceEntryValue | undefined {
  return useContext(Context);
}

const openingAnnouncement = 'Listening. Say one task.';

function announce(message: string) {
  try {
    AccessibilityInfo.announceForAccessibility(message);
  } catch {
    /* Announcements are best effort. */
  }
}

async function haptic(kind: 'start' | 'stop' | 'success') {
  try {
    if (kind === 'success')
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    else
      await Haptics.impactAsync(
        kind === 'start' ? Haptics.ImpactFeedbackStyle.Light : Haptics.ImpactFeedbackStyle.Medium,
      );
  } catch {
    /* Haptics are best effort. */
  }
}

/** With VoiceOver on, listening starts only after the opening announcement has been spoken. */
async function waitForOpeningAnnouncement(): Promise<void> {
  const enabled = await AccessibilityInfo.isScreenReaderEnabled().catch(() => false);
  if (!enabled) return;
  await new Promise<void>((resolve) => {
    let finished = false;
    const done = () => {
      if (finished) return;
      finished = true;
      clearTimeout(timer);
      subscription.remove();
      resolve();
    };
    const timer = setTimeout(done, 2500);
    const subscription = AccessibilityInfo.addEventListener('announcementFinished', done);
    AccessibilityInfo.announceForAccessibility(openingAnnouncement);
  });
}

export function VoiceEntryProvider({
  children,
  native = defaultVoiceNative,
  featureService = defaultFeatureFlagService,
  explainerStorage = voiceExplainerStorage,
}: {
  children: ReactNode;
  native?: VoiceNative;
  featureService?: FeatureFlagService;
  explainerStorage?: VoiceExplainerStorage;
}) {
  return (
    <VoiceAvailabilityProvider featureService={featureService} native={native}>
      <VoiceEntryRuntime native={native} explainerStorage={explainerStorage}>
        {children}
      </VoiceEntryRuntime>
    </VoiceAvailabilityProvider>
  );
}

function VoiceEntryRuntime({
  children,
  native,
  explainerStorage,
}: {
  children: ReactNode;
  native: VoiceNative;
  explainerStorage: VoiceExplainerStorage;
}) {
  const planning = usePlanning();
  const client = useQueryClient();
  const router = useRouter();
  const connectivity = useAuthenticationConnectivity();
  const refreshAvailability = useVoiceAvailabilityRefresh();

  const planningRef = useRef(planning);
  planningRef.current = planning;
  const connectivityRef = useRef(connectivity);
  connectivityRef.current = connectivity;
  const refreshRef = useRef(refreshAvailability);
  refreshRef.current = refreshAvailability;

  const explainerSeen = useRef(false);
  useEffect(() => {
    let active = true;
    explainerStorage
      .read()
      .then((seen) => {
        if (active && seen) explainerSeen.current = true;
      })
      .catch(() => undefined);
    return () => {
      active = false;
    };
  }, [explainerStorage]);

  const account = planning.account;
  const controller: VoiceSessionController = useMemo(
    () =>
      createVoiceSessionController({
        native,
        planning: {
          account,
          service: { create: (...args) => planningRef.current.service.create(...args) },
          credential: () => planningRef.current.credential(),
          current: () => planningRef.current.current(),
          recover: (error) => planningRef.current.recover(error),
        },
        timezone: () => {
          const zone = Intl.DateTimeFormat().resolvedOptions().timeZone;
          return typeof zone === 'string' && zone.length > 0 ? zone : undefined;
        },
        connectivity: () => connectivityRef.current,
        consentSeen: () => explainerSeen.current,
        markConsentSeen: () => {
          explainerSeen.current = true;
          void explainerStorage.write().catch(() => undefined);
        },
        // The same cache refresh the manual create path runs after a confirmed save.
        onCreated: async (item) => {
          if (!planningRef.current.current()) return;
          await client.resetQueries({ queryKey: [...planningKeys.account(account), 'plan'] });
          client.setQueryData(planningKeys.item(account, item.id), item);
          await client.invalidateQueries({ queryKey: [...planningKeys.account(account), 'today'] });
        },
        refreshAvailability: () => refreshRef.current(),
        haptic: (kind) => void haptic(kind),
        announce,
        beforeListening: waitForOpeningAnnouncement,
      }),
    [account, client, explainerStorage, native],
  );

  // Sign-out, session expiry and account change unmount this provider: purge everything.
  useEffect(() => () => controller.dispose(), [controller]);
  useEffect(() => {
    const subscription = AppState.addEventListener('change', (next) =>
      controller.appStateChanged(next),
    );
    return () => subscription.remove();
  }, [controller]);

  const state = useSyncExternalStore(controller.subscribe, controller.getState);
  const [hidden, setHidden] = useState(false);
  const [toast, setToast] = useState<VoiceToastValue | null>(null);

  useEffect(() => {
    if (state.phase === 'done' && state.savedItem) {
      const item = state.savedItem;
      setToast({
        message: savedToast(item.scheduled_for_date, localDate(new Date(), item.timezone)),
        itemId: item.id,
      });
      controller.dismiss();
    } else if (state.phase === 'discarded') {
      if (state.notice) setToast({ message: state.notice });
      else if (
        state.discardReason === 'idle_expired' ||
        state.discardReason === 'background_expired'
      )
        setToast({ message: 'The voice entry was discarded.' });
      controller.dismiss();
    }
  }, [controller, state.discardReason, state.notice, state.phase, state.savedItem]);

  const open = useCallback(
    (entry: VoiceEntryPoint, contextDate: string) => {
      setHidden(false);
      controller.open(entry, contextDate);
    },
    [controller],
  );

  const value = useMemo<VoiceEntryValue>(() => ({ open }), [open]);

  const typeInstead = () => {
    const { entry, contextDate } = controller.getState();
    const prefill = controller.prefill();
    controller.cancel();
    // In-memory, one-shot handoff: the words never enter route params or navigation state.
    setVoicePrefill(prefill);
    router.navigate(
      entry === 'plan'
        ? {
            pathname: routes.app.planItemNew,
            params: { origin: 'plan', selectedDate: contextDate },
          }
        : routes.app.planItemNew,
    );
  };
  const viewToday = () => {
    if (state.phase === 'unknown_outcome') setHidden(true);
    else controller.cancel();
    router.navigate(routes.app.index);
  };

  const visible = !hidden && (isActive(state.phase) || state.phase === 'failed');
  return (
    <Context.Provider value={value}>
      {children}
      <VoiceSheet
        visible={visible}
        state={state}
        controller={controller}
        actions={{
          openSettings: () => void Linking.openSettings().catch(() => undefined),
          typeInstead,
          viewToday,
        }}
      />
      <VoiceToast
        toast={toast}
        onDismiss={() => setToast(null)}
        onView={(id) => {
          setToast(null);
          router.navigate({ pathname: routes.app.planItem, params: { id } });
        }}
      />
    </Context.Provider>
  );
}
