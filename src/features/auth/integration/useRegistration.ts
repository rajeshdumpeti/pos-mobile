import { useCallback, useState } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import type { AuthFailure } from '../domain';
import type { CreateAccountIntent } from '../forms';
import { useAuthenticationCapabilities } from './AuthenticationIntegrationProvider';
import { mapApiErrorToAuthFailure } from './mapApiFailure';
import {
  authMutationKeys,
  authMutationPolicy,
  authQueryKeys,
  authQueryPolicy,
  clearSensitiveMutation,
} from './authQueryPolicy';

export function useRegistrationPolicy() {
  const { registration } = useAuthenticationCapabilities();
  return useQuery({
    queryKey: authQueryKeys.registrationPolicy,
    queryFn: registration.getRegistrationPolicy,
    ...authQueryPolicy,
  });
}

export function useRegistrationController({
  onSuccess,
  onPolicyChanged,
}: {
  onSuccess: () => void;
  onPolicyChanged: () => void;
}) {
  const { registration } = useAuthenticationCapabilities();
  const policyQuery = useRegistrationPolicy();
  const [failure, setFailure] = useState<AuthFailure>();
  const mutation = useMutation({
    mutationKey: authMutationKeys.register,
    mutationFn: registration.register,
    ...authMutationPolicy,
  });
  const submit = useCallback(
    async (values: CreateAccountIntent) => {
      if (!policyQuery.data || mutation.isPending) return false;
      setFailure(undefined);
      try {
        await mutation.mutateAsync({ ...values, policy: policyQuery.data });
        onSuccess();
        return true;
      } catch (error) {
        const safe = mapApiErrorToAuthFailure(error);
        setFailure(safe);
        if (
          safe.kind === 'operation' &&
          [
            'legal_consent_required',
            'legal_consent_not_applicable',
            'legal_acceptance_outdated',
          ].includes(safe.code ?? '')
        ) {
          onPolicyChanged();
          await policyQuery.refetch();
        }
        return false;
      } finally {
        clearSensitiveMutation(mutation);
      }
    },
    [mutation, onPolicyChanged, onSuccess, policyQuery],
  );
  return { policyQuery, submit, failure, isSubmitting: mutation.isPending };
}
