import type { components } from '@/api/generated/schema';
type S = components['schemas'];
export type OnboardingResource = S['OnboardingResponse'];
export type OnboardingPatch = S['OnboardingPatchRequest'];
export type Goals = S['OnboardingGoals'];
export type Priority = OnboardingResource['priority_life_areas'][number];
export type UnitSystem = NonNullable<OnboardingPatch['unit_system']>;
export type Currency = NonNullable<OnboardingPatch['currency']>;
