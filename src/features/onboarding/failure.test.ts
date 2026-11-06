import { ApiError } from '@/api';
import { mapOnboardingFailure } from './failure';

test.each([
  [new ApiError('network', 'private'), 'offline'],
  [new ApiError('timeout', 'private'), 'timeout'],
  [new ApiError('cancelled', 'private'), 'cancelled'],
  [new ApiError('http', 'private', { status: 401 }), 'unauthorized'],
  [new ApiError('http', 'private', { status: 403 }), 'forbidden'],
  [new ApiError('http', 'private', { status: 409 }), 'conflict'],
  [new ApiError('http', 'private', { status: 500 }), 'serverUnavailable'],
  [new ApiError('http', 'private', { status: 503 }), 'serverUnavailable'],
  [new ApiError('invalidResponse', 'private'), 'unexpected'],
] as const)('maps safely without backend prose', (error, kind) => {
  const result = mapOnboardingFailure(error);
  expect(result.kind).toBe(kind);
  expect(result.message).not.toContain('private');
});

test('maps only recognized validation fields to fixed messages', () => {
  const result = mapOnboardingFailure(
    new ApiError('http', 'raw', {
      status: 422,
      fields: [
        { field: 'goals.daily_steps', message: 'secret prose' },
        { field: 'unknown', message: 'raw' },
      ],
    }),
  );
  expect(result).toMatchObject({
    kind: 'validation',
    fields: { daily_steps: 'Check this value.' },
  });
  expect(JSON.stringify(result)).not.toContain('secret prose');
});

test('uses only bounded retry metadata already sanitized by the HTTP boundary', () => {
  expect(
    mapOnboardingFailure(new ApiError('http', 'raw', { status: 429, retryAfterSeconds: 30 })),
  ).toMatchObject({ kind: 'rateLimited', retryAfterSeconds: 30 });
  expect(mapOnboardingFailure(new ApiError('http', 'raw', { status: 429 }))).not.toHaveProperty(
    'retryAfterSeconds',
  );
});
