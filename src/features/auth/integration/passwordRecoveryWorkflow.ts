import type { AuthenticationService } from '@/api/services/authenticationService';

export type PasswordResetState =
  'missing' | 'ready' | 'submitting' | 'invalid' | 'expired' | 'succeeded' | 'failed';

const TOKEN_MIN_LENGTH = 43;
export const PASSWORD_RESET_TOKEN_MAX_LENGTH = 128;

export function isValidResetToken(value: unknown): value is string {
  const hasProhibitedCharacter =
    typeof value === 'string' &&
    [...value].some((character) => {
      const code = character.charCodeAt(0);
      return code <= 31 || code === 127;
    });
  return (
    typeof value === 'string' &&
    value.length >= TOKEN_MIN_LENGTH &&
    value.length <= PASSWORD_RESET_TOKEN_MAX_LENGTH &&
    !hasProhibitedCharacter
  );
}

export function createPasswordRecoveryWorkflow(service: AuthenticationService) {
  let token: string | undefined;
  let state: PasswordResetState = 'missing';
  const listeners = new Set<() => void>();
  const publish = () => listeners.forEach((listener) => listener());
  const setState = (next: PasswordResetState) => {
    state = next;
    publish();
  };
  const clear = (next: PasswordResetState = 'missing') => {
    token = undefined;
    setState(next);
  };

  return {
    request: async (email: string) => {
      const response = await service.requestPasswordReset({ email });
      if (response.status !== 'instructions_if_eligible') {
        throw new Error('Password reset response is invalid.');
      }
    },
    acceptToken: (candidate: unknown) => {
      if (!isValidResetToken(candidate)) {
        clear('invalid');
        return false;
      }
      if (token === candidate && (state === 'ready' || state === 'submitting')) return true;
      token = candidate;
      setState('ready');
      return true;
    },
    confirm: async (newPassword: string) => {
      if (!token || state !== 'ready') throw new Error('Password reset context is unavailable.');
      const submittedToken = token;
      setState('submitting');
      try {
        await service.confirmPasswordReset({ token: submittedToken, new_password: newPassword });
        if (token === submittedToken) clear('succeeded');
      } catch (error) {
        if (token === submittedToken) setState('ready');
        throw error;
      }
    },
    finishTerminalFailure: (outcome: 'invalid' | 'expired') => clear(outcome),
    clear: () => clear(),
    getState: () => state,
    subscribe: (listener: () => void) => {
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    },
  };
}

export type PasswordRecoveryWorkflow = ReturnType<typeof createPasswordRecoveryWorkflow>;
