import type { NavigationAccessStatus } from '@/navigation/navigationPolicy';

export type SessionSummary = {
  accountId: string;
  displayName?: string;
  onboardingRequired: boolean;
};

export type SessionState =
  | { status: 'restoring' }
  | { status: 'restorationFailed'; reason: 'offline' | 'timeout' | 'unavailable' }
  | { status: 'signedOut' }
  | { status: 'signedIn'; account: SessionSummary };

export type SessionEvent =
  | { type: 'restorationFinishedSignedOut' }
  | { type: 'sessionEstablished'; account: SessionSummary }
  | { type: 'sessionEnded' };

export const productionSessionState: SessionState = { status: 'restoring' };

export function reduceSession(_state: SessionState, event: SessionEvent): SessionState {
  if (event.type === 'sessionEstablished') return { status: 'signedIn', account: event.account };
  return { status: 'signedOut' };
}

export function sessionToNavigationAccess(state: SessionState): NavigationAccessStatus {
  if (state.status === 'restoring') return 'checking';
  if (state.status === 'restorationFailed') return 'signedOut';
  return state.status;
}
