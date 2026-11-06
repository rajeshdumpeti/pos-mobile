import type { AuthFailure } from '../domain';

export type AuthResilienceState =
  | { status: 'idle' }
  | { status: 'submitting' }
  | { status: 'offline'; failure: AuthFailure }
  | { status: 'rateLimited'; retryAtMs?: number; failure: AuthFailure }
  | { status: 'resendCooldown'; retryAtMs?: number; failure: AuthFailure }
  | { status: 'retryable'; failure: AuthFailure }
  | { status: 'terminal'; failure: AuthFailure }
  | { status: 'succeeded' };

const MAX_RETRY_SECONDS = 3600;

export function validRetrySeconds(value: unknown): number | undefined {
  return typeof value === 'number' &&
    Number.isInteger(value) &&
    value >= 1 &&
    value <= MAX_RETRY_SECONDS
    ? value
    : undefined;
}

export function validRetryAt(value: unknown, nowMs = Date.now()): number | undefined {
  if (typeof value !== 'string' || value.length > 64) return undefined;
  const parsed = Date.parse(value);
  return Number.isFinite(parsed) && parsed > nowMs && parsed - nowMs <= MAX_RETRY_SECONDS * 1000
    ? parsed
    : undefined;
}

export function retryDeadline(
  metadata: { retryAfterSeconds?: number; retryAt?: string },
  nowMs = Date.now(),
): number | undefined {
  const seconds = validRetrySeconds(metadata.retryAfterSeconds);
  if (seconds !== undefined) return nowMs + seconds * 1000;
  return validRetryAt(metadata.retryAt, nowMs);
}

export function remainingRetrySeconds(deadlineMs: number | undefined, nowMs = Date.now()) {
  return deadlineMs === undefined ? undefined : Math.max(0, Math.ceil((deadlineMs - nowMs) / 1000));
}
