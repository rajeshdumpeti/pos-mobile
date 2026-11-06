import type { OnboardingResource } from './types';
export const onboardingTitles = [
  'The POS Promise',
  'How POS Works',
  'What do you want to improve?',
  'Connect your life',
  'Your goals',
  'Smart notifications that work for you',
  'Meet POS Intelligence',
  'You’re Ready',
] as const;
export function nextActiveStep(step: number): number {
  return Math.min(7, step + 1);
}
export function authoritativeResumeStep(resource: OnboardingResource): number {
  if (resource.status === 'not_started' && resource.version === 0) return 0;
  if (
    resource.status === 'completed' ||
    resource.recommended_next_action === 'onboarding_completed'
  )
    return 7;
  if (resource.recommended_next_action === 'select_priority_life_areas') return 2;
  if (
    resource.recommended_next_action === 'confirm_unit_system' ||
    resource.recommended_next_action === 'confirm_currency'
  )
    return 4;
  if (resource.recommended_next_action === 'complete_onboarding') return 7;
  return 0;
}
