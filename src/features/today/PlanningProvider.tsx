import { createContext, useContext, useEffect, useMemo, useRef, type ReactNode } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { ApiError, createHttpClient } from '@/api';
import { appConfig } from '@/config/env';
import { useAuthenticationCapabilities } from '@/features/auth/integration';
import { useSession } from '@/features/auth/session';
import { createPlanningService, type PlanningService } from './service';
import { createCreationCoordinator, type CreationCoordinator } from './creation';
import { mapPlanningFailure } from './failure';
import type { PlanDraft } from './draft';
export type SavedPlanDraft = { values: PlanDraft; version?: number };
export const planningRoot = ['daily-planning'] as const;
export const planningKeys = {
  account: (account: string) => [...planningRoot, account] as const,
  plan: (account: string, date: string, zone: string) =>
    [...planningRoot, account, 'plan', date, zone] as const,
  today: (account: string, zone: string) => [...planningRoot, account, 'today', zone] as const,
  item: (account: string, id: string) => [...planningRoot, account, 'item', id] as const,
};
export async function clearPlanningAccount(
  client: ReturnType<typeof useQueryClient>,
  account: string,
) {
  const cancelled = client.cancelQueries({ queryKey: planningKeys.account(account) });
  client.removeQueries({ queryKey: planningKeys.account(account) });
  for (const mutation of client.getMutationCache().getAll()) {
    const key = mutation.options.mutationKey;
    if (key?.[0] === planningRoot[0] && key[1] === account)
      client.getMutationCache().remove(mutation);
  }
  await cancelled;
}
const defaultService = createPlanningService(createHttpClient({ baseUrl: appConfig.apiUrl }));
type PlanningContext = {
  account: string;
  service: PlanningService;
  creation: CreationCoordinator;
  drafts: Map<string, SavedPlanDraft>;
  credential: () => string;
  current: () => boolean;
  recover: (error: unknown) => Promise<void>;
};
const Context = createContext<PlanningContext | undefined>(undefined);
export function PlanningProvider({
  account,
  children,
  service = defaultService,
}: {
  account: string;
  children: ReactNode;
  service?: PlanningService;
}) {
  const auth = useAuthenticationCapabilities(),
    client = useQueryClient();
  const active = useRef(true),
    creation = useRef(createCreationCoordinator()),
    drafts = useRef(new Map<string, SavedPlanDraft>());
  const value = useMemo<PlanningContext>(
    () => ({
      account,
      service,
      creation: creation.current,
      drafts: drafts.current,
      current: () =>
        active.current &&
        auth.session.getState().status === 'signedIn' &&
        (() => {
          const state = auth.session.getState();
          return state.status === 'signedIn' && state.account.accountId === account;
        })(),
      credential: () => {
        const state = auth.session.getState(),
          credential = auth.getAccessCredential?.();
        if (
          !active.current ||
          state.status !== 'signedIn' ||
          state.account.accountId !== account ||
          !credential
        )
          throw new ApiError('cancelled', 'Planning access changed.');
        return credential;
      },
      recover: async (error) => {
        if (!active.current) return;
        const state = auth.session.getState();
        if (state.status !== 'signedIn' || state.account.accountId !== account) return;
        const failure = mapPlanningFailure(error);
        if (failure.kind === 'unauthorized' || failure.kind === 'forbidden')
          await auth.session.clear();
        else if (failure.kind === 'onboarding') {
          try {
            await auth.session.refresh();
          } catch {
            /* Session workflow owns safe recovery. */
          }
        }
      },
    }),
    [account, auth, service],
  );
  useEffect(() => {
    active.current = true;
    // Discard foreign feature scopes on entering an account. Keys never contain private text.
    client.removeQueries({
      predicate: (q) => q.queryKey[0] === planningRoot[0] && q.queryKey[1] !== account,
    });
    return () => {
      active.current = false;
      creation.current.reset();
      drafts.current.clear();
      void clearPlanningAccount(client, account);
    };
  }, [account, client]);
  return <Context.Provider value={value}>{children}</Context.Provider>;
}
export function PlanningSessionScope({ children }: { children: ReactNode }) {
  const session = useSession();
  return session.status === 'signedIn' ? (
    <PlanningProvider key={session.account.accountId} account={session.account.accountId}>
      {children}
    </PlanningProvider>
  ) : null;
}
export function usePlanning() {
  const value = useContext(Context);
  if (!value) throw new Error('Planning scope is unavailable.');
  return value;
}
