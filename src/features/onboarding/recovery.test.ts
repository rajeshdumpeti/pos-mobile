import { ApiError } from '@/api';
import { recoverOnboardingFailure } from './recovery';

test('a conflict performs one refetch and never resubmits a mutation', async () => {
  const refetch = jest.fn().mockResolvedValue({ version: 4 }),
    clearSession = jest.fn(),
    submit = jest.fn();
  const result = await recoverOnboardingFailure(new ApiError('http', 'raw', { status: 409 }), {
    refetch,
    clearSession,
  });
  expect(result).toMatchObject({ reviewRequired: true, failure: { kind: 'conflict' } });
  expect(refetch).toHaveBeenCalledTimes(1);
  expect(submit).not.toHaveBeenCalled();
  expect(clearSession).not.toHaveBeenCalled();
});

test('timeout reconciles once without retrying and offline does not queue or refetch', async () => {
  const refetch = jest.fn().mockResolvedValue({}),
    clearSession = jest.fn();
  expect(
    (await recoverOnboardingFailure(new ApiError('timeout', 'raw'), { refetch, clearSession }))
      .reviewRequired,
  ).toBe(true);
  expect(refetch).toHaveBeenCalledTimes(1);
  refetch.mockClear();
  expect(
    (await recoverOnboardingFailure(new ApiError('network', 'raw'), { refetch, clearSession }))
      .failure.kind,
  ).toBe('offline');
  expect(refetch).not.toHaveBeenCalled();
});

test('terminal unauthorized delegates only to the established session boundary', async () => {
  const refetch = jest.fn(),
    clearSession = jest.fn().mockResolvedValue(undefined);
  await recoverOnboardingFailure(new ApiError('http', 'raw', { status: 401 }), {
    refetch,
    clearSession,
  });
  expect(clearSession).toHaveBeenCalledTimes(1);
  expect(refetch).not.toHaveBeenCalled();
});
