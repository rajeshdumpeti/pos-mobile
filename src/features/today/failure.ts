import { ApiError } from '@/api';
export type PlanningFailureKind =
  | 'offline'
  | 'ambiguous'
  | 'unauthorized'
  | 'onboarding'
  | 'forbidden'
  | 'notFound'
  | 'conflict'
  | 'idempotencyConflict'
  | 'validation'
  | 'rateLimited'
  | 'unavailable'
  | 'unexpected';
export type PlanningFailure = {
  kind: PlanningFailureKind;
  message: string;
  requestId?: string;
  retryAfterSeconds?: number;
};
const copy: Record<PlanningFailureKind, string> = {
  offline: 'You’re offline. Previously confirmed information may be out of date.',
  ambiguous: 'We couldn’t confirm the result. Review before retrying.',
  unauthorized: 'Your session needs attention. Sign in again.',
  onboarding: 'Finish your setup before planning your day.',
  forbidden: 'Planning is unavailable for this account.',
  notFound: 'This plan item is no longer available.',
  conflict: 'This item changed. Review its latest version before making another change.',
  idempotencyConflict:
    'This creation attempt needs reconciliation. Retry the original attempt or review Today before starting a new item.',
  validation: 'Check the title, date, timezone and scheduling fields. Nothing is marked as saved.',
  rateLimited: 'Too many requests. Wait before trying again.',
  unavailable: 'Planning is temporarily unavailable. Try again when ready.',
  unexpected: 'We couldn’t verify this response. Nothing is marked as saved.',
};
export function mapPlanningFailure(error: unknown): PlanningFailure {
  let kind: PlanningFailureKind = 'unexpected';
  if (error instanceof ApiError) {
    const status = error.metadata.status,
      code = error.metadata.code;
    if (error.category === 'network') kind = 'offline';
    else if (['timeout', 'cancelled', 'invalidResponse'].includes(error.category))
      kind = 'ambiguous';
    else if (status === 401) kind = 'unauthorized';
    else if (status === 403) kind = code === 'onboarding_required' ? 'onboarding' : 'forbidden';
    else if (status === 404) kind = 'notFound';
    else if (status === 409)
      kind = code === 'plan_item_idempotency_conflict' ? 'idempotencyConflict' : 'conflict';
    else if (status === 422) kind = 'validation';
    else if (status === 429) kind = 'rateLimited';
    else if (status === 500 || status === 503) kind = 'unavailable';
    return {
      kind,
      message: copy[kind],
      requestId: error.metadata.requestId,
      retryAfterSeconds: error.metadata.retryAfterSeconds,
    };
  }
  return { kind, message: copy[kind] };
}
export function isAmbiguousCreation(error: unknown): boolean {
  return (
    error instanceof ApiError &&
    (['network', 'timeout', 'cancelled', 'invalidResponse', 'unexpected'].includes(
      error.category,
    ) ||
      error.metadata.status === 500 ||
      error.metadata.status === 503)
  );
}
