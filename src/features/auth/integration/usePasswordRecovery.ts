import { useCallback, useRef, useState, useSyncExternalStore } from 'react';
import { useMutation } from '@tanstack/react-query';
import type { AuthFailure } from '../domain';
import { useAuthenticationCapabilities } from './AuthenticationIntegrationProvider';
import { authMutationKeys, authMutationPolicy, clearSensitiveMutation } from './authQueryPolicy';
import { mapApiErrorToAuthFailure } from './mapApiFailure';

export function usePasswordResetState() {
  const { passwordRecovery } = useAuthenticationCapabilities();
  return useSyncExternalStore(passwordRecovery.subscribe, passwordRecovery.getState);
}

export function useForgotPasswordController({ onAccepted }: { onAccepted: () => void }) {
  const { passwordRecovery } = useAuthenticationCapabilities();
  const active = useRef(false);
  const [failure, setFailure] = useState<AuthFailure>();
  const mutation = useMutation({
    mutationKey: authMutationKeys.requestPasswordReset,
    mutationFn: (email: string) => passwordRecovery.request(email),
    ...authMutationPolicy,
  });
  const submit = useCallback(
    async ({ email }: { email: string }) => {
      if (active.current) return false;
      active.current = true;
      setFailure(undefined);
      try {
        await mutation.mutateAsync(email);
        onAccepted();
        return true;
      } catch (error) {
        setFailure(mapApiErrorToAuthFailure(error));
        return false;
      } finally {
        clearSensitiveMutation(mutation);
        active.current = false;
      }
    },
    [mutation, onAccepted],
  );
  return { submit, failure, isSubmitting: mutation.isPending };
}

export function useResetPasswordController({ onSuccess }: { onSuccess: () => void }) {
  const { passwordRecovery, session } = useAuthenticationCapabilities();
  const active = useRef(false);
  const [failure, setFailure] = useState<AuthFailure>();
  const mutation = useMutation({
    mutationKey: authMutationKeys.confirmPasswordReset,
    mutationFn: (newPassword: string) => passwordRecovery.confirm(newPassword),
    ...authMutationPolicy,
  });
  const submit = useCallback(
    async ({ newPassword }: { newPassword: string }) => {
      if (active.current || passwordRecovery.getState() !== 'ready') return false;
      active.current = true;
      setFailure(undefined);
      try {
        await mutation.mutateAsync(newPassword);
        // Contract 1.1.0 revokes every session on reset; mirror that locally.
        await session.clear();
        onSuccess();
        return true;
      } catch (error) {
        const safe = mapApiErrorToAuthFailure(error);
        if (safe.kind === 'operation' && safe.code === 'reset_token_invalid') {
          passwordRecovery.finishTerminalFailure('invalid');
        } else if (safe.kind === 'operation' && safe.code === 'reset_token_expired') {
          passwordRecovery.finishTerminalFailure('expired');
        }
        setFailure(safe);
        return false;
      } finally {
        clearSensitiveMutation(mutation);
        active.current = false;
      }
    },
    [mutation, onSuccess, passwordRecovery, session],
  );
  return { submit, failure, isSubmitting: mutation.isPending };
}
