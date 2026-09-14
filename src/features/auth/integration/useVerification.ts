import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from 'react';
import { AppState } from 'react-native';
import { useMutation } from '@tanstack/react-query';
import type { AuthFailure } from '../domain';
import { useAuthenticationCapabilities } from './AuthenticationIntegrationProvider';
import { authMutationKeys, authMutationPolicy, clearSensitiveMutation } from './authQueryPolicy';
import { mapApiErrorToAuthFailure } from './mapApiFailure';

export function useVerificationController({ onVerified }: { onVerified: () => void }) {
  const { registration } = useAuthenticationCapabilities();
  const presentation = useSyncExternalStore(
    registration.subscribe,
    registration.getVerificationPresentation,
    registration.getVerificationPresentation,
  );
  const [failure, setFailure] = useState<AuthFailure>();
  const [notice, setNotice] = useState<string>();
  const active = useRef({ verify: false, resend: false, change: false });
  const verify = useMutation({
    mutationKey: authMutationKeys.verifyEmail,
    mutationFn: registration.verifyEmail,
    ...authMutationPolicy,
  });
  const resend = useMutation({
    mutationKey: authMutationKeys.resendVerification,
    mutationFn: registration.resendVerification,
    ...authMutationPolicy,
  });
  const change = useMutation({
    mutationKey: authMutationKeys.changeUnverifiedEmail,
    mutationFn: registration.changeUnverifiedEmail,
    ...authMutationPolicy,
  });
  const verifyCode = useCallback(
    async (code: string) => {
      if (active.current.verify || !presentation) return false;
      active.current.verify = true;
      setFailure(undefined);
      try {
        const result = await verify.mutateAsync(code);
        if (
          result.status !== 'email_verified' ||
          result.session !== null ||
          result.next_action !== 'await_session_establishment'
        ) {
          throw new Error('Verification response is invalid.');
        }
        registration.completeVerification();
        onVerified();
        return true;
      } catch (error) {
        const safe = mapApiErrorToAuthFailure(error);
        setFailure(safe);
        if (
          safe.kind === 'operation' &&
          [
            'verification_flow_invalid',
            'verification_flow_expired',
            'account_already_exists',
          ].includes(safe.code ?? '')
        ) {
          registration.clear();
        }
        return false;
      } finally {
        clearSensitiveMutation(verify);
        active.current.verify = false;
      }
    },
    [onVerified, presentation, registration, verify],
  );
  const resendCode = useCallback(async () => {
    if (active.current.resend || !presentation) return false;
    active.current.resend = true;
    setFailure(undefined);
    setNotice(undefined);
    try {
      await resend.mutateAsync();
      setNotice('A new verification code was requested.');
      return true;
    } catch (error) {
      const safe = mapApiErrorToAuthFailure(error);
      setFailure(safe);
      if (
        safe.kind === 'operation' &&
        [
          'verification_flow_invalid',
          'verification_flow_expired',
          'account_already_exists',
        ].includes(safe.code ?? '')
      )
        registration.clear();
      return false;
    } finally {
      clearSensitiveMutation(resend);
      active.current.resend = false;
    }
  }, [presentation, registration, resend]);
  const changeEmail = useCallback(
    async (email: string) => {
      if (active.current.change || !presentation) return false;
      active.current.change = true;
      setFailure(undefined);
      setNotice(undefined);
      try {
        await change.mutateAsync(email);
        setNotice('Verification email updated.');
        return true;
      } catch (error) {
        const safe = mapApiErrorToAuthFailure(error);
        setFailure(safe);
        if (
          safe.kind === 'operation' &&
          [
            'verification_flow_invalid',
            'verification_flow_expired',
            'account_already_exists',
          ].includes(safe.code ?? '')
        )
          registration.clear();
        return false;
      } finally {
        clearSensitiveMutation(change);
        active.current.change = false;
      }
    },
    [change, presentation, registration],
  );
  return {
    presentation,
    failure,
    notice,
    verifyCode,
    resendCode,
    changeEmail,
    isVerifying: verify.isPending,
    isResending: resend.isPending,
    isChangingEmail: change.isPending,
    clear: registration.clear,
  };
}

export function useAuthoritativeDeadline(value?: string) {
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    const refresh = () => setNow(Date.now());
    const interval = setInterval(refresh, 1000);
    const subscription = AppState.addEventListener('change', (state) => {
      if (state === 'active') refresh();
    });
    return () => {
      clearInterval(interval);
      subscription.remove();
    };
  }, []);
  const deadline = value ? Date.parse(value) : Number.NaN;
  const remainingSeconds = Number.isFinite(deadline)
    ? Math.max(0, Math.ceil((deadline - now) / 1000))
    : undefined;
  return { remainingSeconds, ready: remainingSeconds === 0 };
}
