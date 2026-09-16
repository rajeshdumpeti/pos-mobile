import {
  remainingRetrySeconds,
  retryDeadline,
  validRetryAt,
  validRetrySeconds,
} from './authResilience';

test('validated relative timing takes precedence and countdown never becomes negative', () => {
  const now = Date.parse('2026-09-15T12:00:00Z');
  expect(retryDeadline({ retryAfterSeconds: 30, retryAt: '2026-09-15T12:00:45Z' }, now)).toBe(
    now + 30_000,
  );
  expect(remainingRetrySeconds(now + 30_000, now)).toBe(30);
  expect(remainingRetrySeconds(now + 30_000, now + 31_000)).toBe(0);
});

test.each([undefined, null, 0, -1, 1.5, Number.NaN, Infinity, 3601, '30'])(
  'rejects unsafe relative retry metadata: %p',
  (value) => expect(validRetrySeconds(value)).toBeUndefined(),
);

test('accepts bounded absolute timing and rejects malformed, past, and excessive values', () => {
  const now = Date.parse('2026-09-15T12:00:00Z');
  expect(validRetryAt('2026-09-15T12:00:30Z', now)).toBe(now + 30_000);
  expect(validRetryAt('not-a-date', now)).toBeUndefined();
  expect(validRetryAt('2026-09-15T11:59:59Z', now)).toBeUndefined();
  expect(validRetryAt('2026-09-15T14:00:00Z', now)).toBeUndefined();
});
