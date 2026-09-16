import { ApiError } from '@/api';
import type { components } from '@/api/generated/schema';
import type { AuthenticationService } from '@/api/services/authenticationService';
import type { SessionState, SessionSummary } from '../session';
import type { CredentialVault } from './credentials';
import type { RegistrationWorkflow } from './registrationWorkflow';

type Schemas = components['schemas'];
type SignInResult = { kind: 'authenticated' } | { kind: 'verificationRequired' };

function summary(
  value: Schemas['SessionTokenResponse'] | Schemas['CurrentSessionResponse'],
): SessionSummary {
  const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  if (
    !uuid.test(value.account_id) ||
    !uuid.test(value.session_id) ||
    typeof value.onboarding_required !== 'boolean'
  )
    throw new Error('Session response is invalid.');
  return {
    accountId: value.account_id,
    onboardingRequired: value.onboarding_required,
    ...('display_name' in value && value.display_name ? { displayName: value.display_name } : {}),
  };
}

function credentials(value: Schemas['SessionTokenResponse']) {
  if (
    value.token_type !== 'Bearer' ||
    !value.access_token ||
    !value.refresh_token ||
    !Number.isFinite(Date.parse(value.access_expires_at)) ||
    !Number.isFinite(Date.parse(value.refresh_expires_at))
  )
    throw new Error('Session response is invalid.');
  return { accessCredential: value.access_token, refreshCredential: value.refresh_token };
}

const terminalCodes = new Set([
  'refresh_session_invalid',
  'refresh_session_expired',
  'refresh_session_replayed',
  'refresh_idempotency_conflict',
  'authentication_required',
  'access_token_invalid',
  'access_token_expired',
  'account_unavailable',
]);

export function createSessionWorkflow(
  service: AuthenticationService,
  vault: CredentialVault,
  registration: RegistrationWorkflow,
) {
  let state: SessionState = { status: 'restoring' };
  let bootstrap: Promise<void> | undefined;
  let refreshing: Promise<boolean> | undefined;
  let retryableRefresh: { credential: string; idempotencyKey: string } | undefined;
  let sequence = 0;
  let revision = 0;
  const listeners = new Set<() => void>();
  const publish = (next: SessionState) => {
    state = next;
    listeners.forEach((listener) => listener());
  };
  const clear = async () => {
    revision += 1;
    retryableRefresh = undefined;
    const secureDeletion = vault.clear();
    registration.clear();
    publish({ status: 'signedOut' });
    await secureDeletion;
  };
  const establish = async (value: Schemas['SessionTokenResponse']) => {
    const account = summary(value);
    const committed = await vault.commit(credentials(value));
    if (!committed.ok) {
      await clear();
      throw new Error('Secure session storage is unavailable.');
    }
    publish({ status: 'signedIn', account });
  };
  const refresh = (expectedRevision = revision) => {
    if (refreshing) return refreshing;
    refreshing = (async () => {
      let attempt = retryableRefresh;
      if (!attempt) {
        const stored = await vault.readRefreshForValidation();
        if (expectedRevision !== revision) return false;
        if (!stored.ok || stored.status !== 'available') {
          await clear();
          return false;
        }
        attempt = {
          credential: stored.refreshCredential,
          idempotencyKey: `mobile-refresh-${Date.now().toString(36)}-${++sequence}`,
        };
      }
      try {
        const value = await service.refresh(
          { refresh_token: attempt.credential },
          attempt.idempotencyKey,
        );
        if (expectedRevision !== revision) return false;
        const rotated = await vault.rotate(credentials(value));
        if (!rotated.ok) throw new Error('Secure session storage is unavailable.');
        const current = await service.getCurrentSession(value.access_token);
        if (expectedRevision !== revision) return false;
        publish({ status: 'signedIn', account: summary(current) });
        retryableRefresh = undefined;
        return true;
      } catch (error) {
        if (expectedRevision !== revision) return false;
        const code = error instanceof ApiError ? error.metadata.code : undefined;
        if (
          !(error instanceof ApiError) ||
          error.category === 'invalidResponse' ||
          terminalCodes.has(code ?? '')
        ) {
          retryableRefresh = undefined;
          await clear();
        } else {
          retryableRefresh = attempt;
          publish({ status: 'signedOut' });
        }
        throw error;
      } finally {
        refreshing = undefined;
      }
    })();
    return refreshing;
  };
  const initialize = () => {
    if (!bootstrap)
      bootstrap = (async () => {
        const expectedRevision = revision;
        const stored = await vault.readRefreshForValidation();
        if (expectedRevision !== revision) return;
        if (!stored.ok || stored.status === 'missing') return clear();
        try {
          await refresh(expectedRevision);
        } catch (error) {
          if (expectedRevision !== revision || !(error instanceof ApiError)) return;
          const reason =
            error.category === 'network'
              ? 'offline'
              : error.category === 'timeout'
                ? 'timeout'
                : 'unavailable';
          publish({ status: 'restorationFailed', reason });
        }
      })();
    return bootstrap;
  };
  return {
    getState: () => state,
    subscribe: (listener: () => void) => {
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    },
    initialize,
    retryRestoration: () => {
      if (state.status !== 'signedOut' && state.status !== 'restorationFailed') return initialize();
      bootstrap = undefined;
      return initialize();
    },
    signIn: async (email: string, password: string): Promise<SignInResult> => {
      revision += 1;
      retryableRefresh = undefined;
      const value = await service.signIn({ email, password });
      if ('code' in value) {
        if (value.code !== 'email_not_verified' || !value.actions.includes('verify_email'))
          throw new Error('Verification continuation is invalid.');
        registration.replaceVerificationContinuation(value.verification_flow);
        return { kind: 'verificationRequired' };
      }
      await establish(value);
      return { kind: 'authenticated' };
    },
    refresh,
    logout: async () => {
      const access = vault.getAccessCredential();
      await clear();
      try {
        if (access) await service.signOut(access);
      } catch {
        // Local credential destruction is authoritative for offline logout.
      }
    },
    logoutAll: async () => {
      const access = vault.getAccessCredential();
      await clear();
      if (!access) return false;
      try {
        await service.signOutAll(access);
        return true;
      } catch {
        return false;
      }
    },
    clear,
  };
}

export type SessionWorkflow = ReturnType<typeof createSessionWorkflow>;
