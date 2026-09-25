import type { HttpRequest } from '@/api/client';
import type { components } from '@/api/generated/schema';
import type { OnboardingPatch } from './types';
import { requireOnboardingResource } from './validation';
type Request = <R, B = never>(input: HttpRequest<B>) => Promise<R>;
export function createOnboardingService(request: Request) {
  return {
    get: async (credential: string, signal?: AbortSignal) =>
      requireOnboardingResource(
        await request<unknown>({
          path: '/api/v1/onboarding',
          method: 'GET',
          credential,
          signal,
          expectedStatuses: [200],
        }),
      ),
    patch: async (credential: string, body: OnboardingPatch) =>
      requireOnboardingResource(
        await request<unknown, OnboardingPatch>({
          path: '/api/v1/onboarding',
          method: 'PATCH',
          credential,
          body,
          expectedStatuses: [200],
        }),
      ),
    complete: async (credential: string, expected_version: number) =>
      requireOnboardingResource(
        await request<unknown, components['schemas']['CompleteOnboardingRequest']>({
          path: '/api/v1/onboarding/complete',
          method: 'POST',
          credential,
          body: { expected_version },
          expectedStatuses: [200],
        }),
      ),
  };
}
