import { mapOnboardingFailure } from './failure';
export async function recoverOnboardingFailure(
  error: unknown,
  {
    refetch,
    clearSession,
  }: { refetch: () => Promise<unknown>; clearSession: () => Promise<unknown> },
) {
  const failure = mapOnboardingFailure(error);
  if (failure.kind === 'unauthorized') await clearSession();
  if (failure.kind === 'conflict' || failure.kind === 'timeout') await refetch();
  return { failure, reviewRequired: failure.kind === 'conflict' || failure.kind === 'timeout' };
}
