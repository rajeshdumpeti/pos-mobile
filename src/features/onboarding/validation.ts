import { ApiError } from '@/api';
import type { OnboardingResource } from './types';
export function requireOnboardingResource(value: unknown): OnboardingResource {
  if (!value || typeof value !== 'object')
    throw new ApiError('invalidResponse', 'Invalid onboarding response.');
  const v = value as Record<string, unknown>;
  const object = (x: unknown): x is Record<string, unknown> =>
    Boolean(x) && typeof x === 'object' && !Array.isArray(x);
  const config = v.configuration,
    requirements = v.requirements,
    unit = v.unit_preference,
    currency = v.currency_preference;
  if (
    v.contract_version !== '1.0' ||
    !Number.isInteger(v.version) ||
    (v.version as number) < 0 ||
    !['not_started', 'in_progress', 'completed'].includes(String(v.status)) ||
    !Array.isArray(v.priority_life_areas) ||
    !object(config) ||
    !object(requirements) ||
    !object(unit) ||
    !object(currency) ||
    typeof unit.confirmed !== 'boolean' ||
    typeof currency.confirmed !== 'boolean' ||
    !Array.isArray(config.priority_life_areas) ||
    !Array.isArray(config.unit_systems) ||
    !Array.isArray(config.currencies) ||
    !Array.isArray(config.optional_goal_fields) ||
    !Array.isArray(config.integration_identifiers) ||
    !Array.isArray(config.notification_identifiers) ||
    typeof requirements.ready_to_complete !== 'boolean' ||
    !object(v.goals) ||
    !object(v.integration_preferences) ||
    !object(v.notification_preferences) ||
    !(v.completed_at === null || typeof v.completed_at === 'string')
  )
    throw new ApiError('invalidResponse', 'Invalid onboarding response.');
  return value as OnboardingResource;
}
