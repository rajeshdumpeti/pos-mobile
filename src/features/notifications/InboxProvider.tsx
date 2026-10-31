import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { AppState } from 'react-native';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { ApiError, createHttpClient } from '@/api';
import { appConfig } from '@/config/env';
import { useSession } from '@/features/auth/session';
import { useAuthenticationCapabilities } from '@/features/auth/integration';
import { useAuthenticationConnectivity } from '@/features/auth/integration/useConnectivity';
import { isTimeZone, resolveTimeZone } from '@/features/today/time';
import { createInboxService, type InboxService } from './service';
import { inboxKeys, inboxRoot, createTimezoneSync } from './state';
export const inboxQueryPolicy = {
  retry: false,
  staleTime: 0,
  gcTime: Infinity,
  networkMode: 'always',
  refetchOnWindowFocus: false,
  refetchOnReconnect: false,
} as const;
const defaultService = createInboxService(createHttpClient({ baseUrl: appConfig.apiUrl }));
export type InboxContextValue = {
  account: string;
  service: InboxService;
  zone: string | undefined;
  timezoneFailed: boolean;
  credential: () => string;
  current: () => boolean;
  recover: (error: unknown) => Promise<void>;
  lock: { current: boolean };
  sync: () => void;
};
const Context = createContext<InboxContextValue | undefined>(undefined);
export async function clearInboxAccount(
  client: ReturnType<typeof useQueryClient>,
  account: string,
) {
  const pending = client.cancelQueries({ queryKey: inboxKeys.account(account) });
  client.removeQueries({ queryKey: inboxKeys.account(account) });
  await pending;
}
function deviceZone() {
  try {
    const zone = resolveTimeZone();
    return zone && isTimeZone(zone) ? zone : undefined;
  } catch {
    return undefined;
  }
}
export function InboxProvider({
  account,
  eligible,
  children,
  service = defaultService,
}: {
  account: string;
  eligible: boolean;
  children: ReactNode;
  service?: InboxService;
}) {
  const auth = useAuthenticationCapabilities(),
    client = useQueryClient();
  const connectivity = useAuthenticationConnectivity();
  const active = useRef(true),
    lock = useRef(false),
    synchronize = useRef(createTimezoneSync());
  const [zone, setZone] = useState(deviceZone),
    [timezoneFailed, setTimezoneFailed] = useState(false);
  const value = useMemo<InboxContextValue>(() => {
    const current = () => {
      const state = auth.session.getState();
      return active.current && state.status === 'signedIn' && state.account.accountId === account;
    };
    const credential = () => {
      const value = auth.getAccessCredential?.();
      if (!current() || !value) throw new ApiError('cancelled', 'Notification access changed.');
      return value;
    };
    const recover = async (error: unknown) => {
      if (!current() || !(error instanceof ApiError)) return;
      if (
        error.metadata.status === 401 ||
        (error.metadata.status === 403 && error.metadata.code !== 'onboarding_required')
      )
        await auth.session.clear();
      else if (error.metadata.code === 'onboarding_required') {
        try {
          await auth.session.refresh();
        } catch {
          /* shared recovery */
        }
      }
    };
    return {
      account,
      service,
      zone,
      timezoneFailed,
      credential,
      current,
      recover,
      lock,
      sync: () => {
        const next = deviceZone();
        setZone(next);
        if (!next || connectivity === 'offline') {
          setTimezoneFailed(true);
          return;
        }
        void synchronize
          .current(next, (z) => service.timezone(credential(), z), current)
          .then(() => {
            if (current()) setTimezoneFailed(false);
          })
          .catch((error) => {
            if (current()) {
              setTimezoneFailed(true);
              void recover(error);
            }
          });
      },
    };
  }, [account, auth, service, zone, timezoneFailed, connectivity]);
  const latest = useRef(value);
  latest.current = value;
  useEffect(() => {
    active.current = true;
    client.removeQueries({
      predicate: (q) => q.queryKey[0] === inboxRoot[0] && q.queryKey[1] !== account,
    });
    latest.current.sync();
    const subscription = AppState.addEventListener('change', (state) => {
      if (state === 'active') {
        latest.current.sync();
        void client.invalidateQueries({ queryKey: inboxKeys.account(account) });
      }
    });
    return () => {
      active.current = false;
      subscription.remove();
      void clearInboxAccount(client, account);
    };
  }, [account, client]);
  return (
    <Context.Provider value={value}>
      {eligible && <BadgeRecovery />}
      {children}
    </Context.Provider>
  );
}
function BadgeRecovery() {
  const badge = useInboxBadge();
  const context = useContext(Context);
  useEffect(() => {
    if (badge?.error) void context?.recover(badge.error);
  }, [badge?.error, context]);
  return null;
}
export function InboxSessionScope({ children }: { children: ReactNode }) {
  const state = useSession();
  return state.status === 'signedIn' ? (
    <InboxProvider
      key={state.account.accountId}
      account={state.account.accountId}
      eligible={!state.account.onboardingRequired}
    >
      {children}
    </InboxProvider>
  ) : (
    children
  );
}
export function useInboxContext() {
  const value = useContext(Context);
  if (!value) throw new Error('Inbox scope is unavailable.');
  return value;
}
export function useInboxBadge() {
  const value = useContext(Context),
    connectivity = useAuthenticationConnectivity();
  const query = useQuery({
    ...inboxQueryPolicy,
    queryKey: value ? inboxKeys.count(value.account) : [...inboxRoot, 'inactive'],
    enabled: Boolean(value) && connectivity !== 'offline',
    queryFn: async ({ signal }) => {
      if (!value) throw new ApiError('cancelled', 'Inbox is unavailable.');
      const data = await value.service.count(value.credential(), signal);
      if (!value.current() || signal.aborted)
        throw new ApiError('cancelled', 'Inbox access changed.');
      return { unread_count: data.unread_count };
    },
  });
  return value ? { ...query, stale: query.isError || connectivity === 'offline' } : undefined;
}

export function useHasInboxScope() {
  return Boolean(useContext(Context));
}
