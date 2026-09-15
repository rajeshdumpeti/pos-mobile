import { useCallback, useEffect, useRef, useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import type { AuthFailure } from '../domain';
import type { SignInFormValues } from '../forms';
import { useAuthenticationCapabilities } from './AuthenticationIntegrationProvider';
import { authMutationKeys, authMutationPolicy, clearSensitiveMutation } from './authQueryPolicy';
import { mapApiErrorToAuthFailure } from './mapApiFailure';

export function useSignInController({
  onAuthenticated,
  onVerificationRequired,
}: {
  onAuthenticated: () => void;
  onVerificationRequired: () => void;
}) {
  const { session } = useAuthenticationCapabilities();
  const mounted = useRef(true);
  const active = useRef(false);
  const [failure, setFailure] = useState<AuthFailure>();
  useEffect(() => () => void (mounted.current = false), []);
  const mutation = useMutation({
    mutationKey: authMutationKeys.signIn,
    mutationFn: ({ email, password }: SignInFormValues) => session.signIn(email, password),
    ...authMutationPolicy,
  });
  const submit = useCallback(
    async (values: SignInFormValues) => {
      if (active.current) return false;
      active.current = true;
      if (mounted.current) setFailure(undefined);
      try {
        const result = await mutation.mutateAsync(values);
        if (!mounted.current) return false;
        if (result.kind === 'verificationRequired') onVerificationRequired();
        else onAuthenticated();
        return true;
      } catch (error) {
        if (mounted.current) setFailure(mapApiErrorToAuthFailure(error));
        return false;
      } finally {
        clearSensitiveMutation(mutation);
        active.current = false;
      }
    },
    [mutation, onAuthenticated, onVerificationRequired, session],
  );
  return { submit, failure, isSubmitting: mutation.isPending };
}
