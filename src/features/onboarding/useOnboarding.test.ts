import { onboardingKey, versionedPatch } from './useOnboarding';
import type { OnboardingPatch } from './types';
test('uses the current authoritative version on each new explicit submission', () => {
  const draft: Omit<OnboardingPatch, 'expected_version'> = { priority_life_areas: ['health'] };
  expect(versionedPatch(draft, 2)).toEqual({
    priority_life_areas: ['health'],
    expected_version: 2,
  });
  expect(versionedPatch(draft, 5)).toEqual({
    priority_life_areas: ['health'],
    expected_version: 5,
  });
});
test('query key is stable and contains no account or onboarding values', () =>
  expect(onboardingKey).toEqual(['onboarding', 'current']));
