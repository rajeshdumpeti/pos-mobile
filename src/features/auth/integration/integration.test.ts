import { ApiError } from '@/api';
import { MutationObserver, QueryClient, onlineManager } from '@tanstack/react-query';
import { createQueryClient } from '@/lib/query/queryClient';
import { mapApiErrorToAuthFailure } from './mapApiFailure';
import { inspectSessionBootstrap } from './sessionBootstrap';
import {
  authMutationKeys,
  authMutationPolicy,
  authQueryKeys,
  authQueryPolicy,
  clearSensitiveMutation,
} from './authQueryPolicy';
test.each([
  ['network', 'offline'],
  ['timeout', 'timeout'],
  ['cancelled', 'cancelled'],
] as const)('maps %s safely', (source, target) =>
  expect(mapApiErrorToAuthFailure(new ApiError(source, 'raw secret'))).toMatchObject({
    kind: 'transport',
    category: target,
  }),
);
test('maps documented backend metadata without raw content', () => {
  const mapped = mapApiErrorToAuthFailure(
    new ApiError('http', 'raw', {
      status: 429,
      code: 'rate_limited',
      requestId: 'req-1',
      retryAfterSeconds: 30,
    }),
  );
  expect(mapped).toMatchObject({
    kind: 'operation',
    category: 'rateLimited',
    requestId: 'req-1',
    retryAfterSeconds: 30,
  });
  expect(JSON.stringify(mapped)).not.toContain('raw');
  expect(
    mapApiErrorToAuthFailure(new ApiError('http', 'secret', { code: 'unknown' })),
  ).toMatchObject({ category: 'unexpected' });
});
test.each([
  'invalid_credentials',
  'email_not_verified',
  'account_unavailable',
  'account_already_exists',
  'verification_flow_invalid',
  'verification_flow_expired',
  'verification_code_invalid',
  'verification_code_expired',
  'verification_attempts_exceeded',
  'resend_cooldown_active',
  'refresh_session_invalid',
  'refresh_session_expired',
  'refresh_session_replayed',
  'refresh_idempotency_conflict',
  'authentication_required',
  'access_token_invalid',
  'access_token_expired',
  'reset_token_invalid',
  'reset_token_expired',
  'password_rejected',
  'legal_acceptance_outdated',
  'legal_consent_required',
  'legal_consent_not_applicable',
  'authentication_configuration_unavailable',
  'dependency_unavailable',
  'internal_server_error',
  'rate_limited',
])('maps documented code %s to a known safe failure', (code) => {
  expect(mapApiErrorToAuthFailure(new ApiError('http', 'raw', { code }))).not.toMatchObject({
    category: 'unexpected',
  });
});
test.each([
  [{ ok: true, status: 'missing' }, 'noCredential'],
  [{ ok: true, status: 'available', refreshCredential: 'opaque' }, 'requiresValidation'],
  [{ ok: false, reason: 'unsupported' }, 'storageUnavailable'],
  [{ ok: false, reason: 'malformed' }, 'malformedCredential'],
] as const)('bootstrap finishes signed out without trusting storage', async (read, reason) => {
  const vault = { readRefreshForValidation: jest.fn(async () => read) };
  await expect(inspectSessionBootstrap(vault as never)).resolves.toEqual({
    status: 'signedOut',
    reason,
  });
});
test('query policy has PII-free keys, no retry, immediate execution and cleanup', () => {
  expect(authMutationPolicy).toEqual({ retry: false, networkMode: 'always', gcTime: 0 });
  expect(authQueryPolicy).toEqual({
    retry: false,
    networkMode: 'always',
    gcTime: 0,
    staleTime: 0,
  });
  expect(JSON.stringify({ authMutationKeys, authQueryKeys })).not.toMatch(
    /@|Bearer|example|[A-Za-z0-9]{40}/,
  );
  const reset = jest.fn();
  clearSensitiveMutation({ reset });
  expect(reset).toHaveBeenCalledTimes(1);
  expect(createQueryClient().getDefaultOptions().queries?.retry).toBe(1);
});
test('offline Authentication intent fails immediately and reconnect does not replay it', async () => {
  const client = new QueryClient();
  const mutation = jest.fn(async () => {
    throw new Error('offline');
  });
  const observer = new MutationObserver(client, { ...authMutationPolicy, mutationFn: mutation });
  onlineManager.setOnline(false);
  await expect(observer.mutate()).rejects.toThrow('offline');
  expect(mutation).toHaveBeenCalledTimes(1);
  onlineManager.setOnline(true);
  await Promise.resolve();
  expect(mutation).toHaveBeenCalledTimes(1);
  client.clear();
});
