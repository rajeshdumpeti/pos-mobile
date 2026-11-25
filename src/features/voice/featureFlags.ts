import { z } from 'zod';
import { createHttpClient, type HttpRequest } from '@/api/client';
import { appConfig } from '@/config/env';
import { planningRoot } from '@/features/today/PlanningProvider';

type Request = <R, B = never>(input: HttpRequest<B>) => Promise<R>;

/** Strict: any extra, missing or mistyped field is an error, so voice stays off (fail closed). */
const featureFlagsSchema = z.strictObject({
  contract_version: z.literal('1.0'),
  voice_entry: z.strictObject({ enabled: z.boolean() }),
});

export type FeatureFlags = { voiceEntryEnabled: boolean };

export function parseFeatureFlags(value: unknown): FeatureFlags {
  const parsed = featureFlagsSchema.parse(value);
  return { voiceEntryEnabled: parsed.voice_entry.enabled };
}

export function createFeatureFlagService(request: Request) {
  return {
    get: async (credential: string, signal?: AbortSignal): Promise<FeatureFlags> =>
      parseFeatureFlags(
        await request<unknown>({
          path: '/api/v1/features',
          method: 'GET',
          credential,
          signal,
          expectedStatuses: [200],
        }),
      ),
  };
}
export type FeatureFlagService = ReturnType<typeof createFeatureFlagService>;

export const defaultFeatureFlagService = createFeatureFlagService(
  createHttpClient({ baseUrl: appConfig.apiUrl }),
);

/** Scoped to the account and nested under the planning root, so account changes purge it. */
export const featureFlagKeys = {
  account: (account: string) => [...planningRoot, account, 'features'] as const,
};
