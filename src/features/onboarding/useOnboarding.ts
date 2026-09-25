import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { createHttpClient } from '@/api';
import { appConfig } from '@/config/env';
import { useAuthenticationCapabilities } from '@/features/auth/integration';
import { createOnboardingService } from './service';
import type { OnboardingPatch } from './types';
import type { OnboardingFailure } from './failure';
import { ApiError } from '@/api';
import { recoverOnboardingFailure } from './recovery';
export const onboardingKey = ['onboarding', 'current'] as const;
export function versionedPatch(
  patch: Omit<OnboardingPatch, 'expected_version'>,
  version: number,
): OnboardingPatch {
  return { ...patch, expected_version: version };
}
const service = createOnboardingService(createHttpClient({ baseUrl: appConfig.apiUrl }));
export function useOnboarding() {
  const [failure, setFailure] = useState<OnboardingFailure>();
  const [reviewRequired, setReviewRequired] = useState(false);
  const auth = useAuthenticationCapabilities(),
    credential = auth.getAccessCredential?.(),
    client = useQueryClient();
  const query = useQuery({
    queryKey: onboardingKey,
    queryFn: ({ signal }) => service.get(credential!, signal),
    enabled: Boolean(credential),
    staleTime: 0,
    retry: false,
  });
  const recover = async (error: unknown) => {
    const recovered = await recoverOnboardingFailure(error, {
      refetch: query.refetch,
      clearSession: auth.session.clear,
    });
    setFailure(recovered.failure);
    setReviewRequired(recovered.reviewRequired);
  };
  const save = useMutation({
    mutationFn: (patch: Omit<OnboardingPatch, 'expected_version'>) =>
      service.patch(credential!, versionedPatch(patch, query.data!.version)),
    retry: false,
    networkMode: 'always',
    onMutate: () => setFailure(undefined),
    onSuccess: (data) => {
      client.setQueryData(onboardingKey, data);
      setReviewRequired(false);
    },
    onError: recover,
  });
  const complete = useMutation({
    mutationFn: () => service.complete(credential!, query.data!.version),
    retry: false,
    networkMode: 'always',
    onMutate: () => setFailure(undefined),
    onSuccess: async (data) => {
      client.setQueryData(onboardingKey, data);
      await auth.session.refresh();
      const session = auth.session.getState();
      if (session.status !== 'signedIn' || session.account.onboardingRequired)
        throw new ApiError('invalidResponse', 'Session did not confirm onboarding completion.');
    },
    onError: recover,
  });
  return {
    query,
    save,
    complete,
    failure,
    reviewRequired,
    acknowledgeReview: () => {
      setFailure(undefined);
      setReviewRequired(false);
    },
  };
}
