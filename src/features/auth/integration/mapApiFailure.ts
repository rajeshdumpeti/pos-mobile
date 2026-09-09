import { ApiError } from '@/api';
import type { AuthFailure } from '../domain';
import { mapAuthFailure } from '../domain';
export function mapApiErrorToAuthFailure(error: unknown): AuthFailure {
  if (!(error instanceof ApiError)) return mapAuthFailure(undefined);
  if (error.category === 'network')
    return {
      kind: 'transport',
      category: 'offline',
      message: 'Check your connection and try again.',
    };
  if (error.category === 'timeout')
    return {
      kind: 'transport',
      category: 'timeout',
      message: 'The request took too long. Try again.',
    };
  if (error.category === 'cancelled')
    return { kind: 'transport', category: 'cancelled', message: 'The request was cancelled.' };
  if (error.category !== 'http') return mapAuthFailure(undefined);
  return mapAuthFailure({
    code: error.metadata.code,
    request_id: error.metadata.requestId,
    retry_after_seconds: error.metadata.retryAfterSeconds,
  });
}
