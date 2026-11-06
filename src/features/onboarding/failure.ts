import { ApiError } from '@/api';
import type { GoalField } from './goals';

export type OnboardingFailureKind =
  | 'offline'
  | 'timeout'
  | 'cancelled'
  | 'unauthorized'
  | 'forbidden'
  | 'conflict'
  | 'validation'
  | 'rateLimited'
  | 'serverUnavailable'
  | 'unexpected';
export type OnboardingFailure = {
  kind: OnboardingFailureKind;
  message: string;
  retryAfterSeconds?: number;
  fields?: Partial<Record<GoalField, string>>;
};
const goalFields = new Set<GoalField>([
  'target_weight',
  'daily_protein_grams',
  'daily_water',
  'daily_calories_kcal',
  'daily_steps',
  'workouts_per_week',
  'focus_minutes_per_day',
  'target_sleep_minutes',
  'budget_target',
]);
const messages: Record<OnboardingFailureKind, string> = {
  offline: 'You’re offline. Changes have not been saved.',
  timeout: 'The request took too long. Review the latest setup before trying again.',
  cancelled: 'The request was cancelled. Nothing was marked as saved.',
  unauthorized: 'Your session needs attention.',
  forbidden: 'Setup is unavailable for this account.',
  conflict:
    'Your setup changed in another session. Review the refreshed information before trying again.',
  validation: 'Review the highlighted setup fields.',
  rateLimited: 'Too many setup requests. Try again later.',
  serverUnavailable: 'Setup is temporarily unavailable. Try again when ready.',
  unexpected: 'POS received an unexpected response. Nothing was marked as saved.',
};
export function mapOnboardingFailure(error: unknown): OnboardingFailure {
  if (!(error instanceof ApiError)) return { kind: 'unexpected', message: messages.unexpected };
  if (error.category === 'network') return { kind: 'offline', message: messages.offline };
  if (error.category === 'timeout') return { kind: 'timeout', message: messages.timeout };
  if (error.category === 'cancelled') return { kind: 'cancelled', message: messages.cancelled };
  if (error.category !== 'http') return { kind: 'unexpected', message: messages.unexpected };
  const status = error.metadata.status;
  if (status === 401) return { kind: 'unauthorized', message: messages.unauthorized };
  if (status === 403) return { kind: 'forbidden', message: messages.forbidden };
  if (status === 409) return { kind: 'conflict', message: messages.conflict };
  if (status === 422) {
    const fields: Partial<Record<GoalField, string>> = {};
    for (const detail of error.metadata.fields ?? []) {
      const field = detail.field.split('.').at(-1) as GoalField;
      if (goalFields.has(field)) fields[field] = 'Check this value.';
    }
    return { kind: 'validation', message: messages.validation, fields };
  }
  if (status === 429)
    return {
      kind: 'rateLimited',
      message: messages.rateLimited,
      ...(error.metadata.retryAfterSeconds
        ? { retryAfterSeconds: error.metadata.retryAfterSeconds }
        : {}),
    };
  if (status === 500 || status === 503)
    return { kind: 'serverUnavailable', message: messages.serverUnavailable };
  return { kind: 'unexpected', message: messages.unexpected };
}
