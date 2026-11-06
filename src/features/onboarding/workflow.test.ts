import { authoritativeResumeStep, nextActiveStep, onboardingTitles } from './workflow';
const resource = (action: string, overrides = {}) =>
  ({
    status: 'in_progress',
    version: 1,
    recommended_next_action: action,
    requirements: { ready_to_complete: false },
    ...overrides,
  }) as never;
test('represents exactly the approved eight-screen sequence', () =>
  expect(onboardingTitles).toEqual([
    'The POS Promise',
    'How POS Works',
    'What do you want to improve?',
    'Connect your life',
    'Your goals',
    'Smart notifications that work for you',
    'Meet POS Intelligence',
    'You’re Ready',
  ]));
test.each([
  ['select_priority_life_areas', 2],
  ['confirm_unit_system', 4],
  ['confirm_currency', 4],
  ['complete_onboarding', 7],
  ['onboarding_completed', 7],
] as const)('resumes %s at authoritative step', (action, step) =>
  expect(authoritativeResumeStep(resource(action))).toBe(step),
);
test('completed state cannot restart onboarding', () =>
  expect(authoritativeResumeStep(resource('onboarding_completed', { status: 'completed' }))).toBe(
    7,
  ));
test('a new version-zero account sees the educational introduction', () =>
  expect(
    authoritativeResumeStep(
      resource('select_priority_life_areas', { status: 'not_started', version: 0 }),
    ),
  ).toBe(0));
test('active forward navigation always follows the approved sequence', () => {
  expect(Array.from({ length: 7 }, (_, step) => nextActiveStep(step))).toEqual([
    1, 2, 3, 4, 5, 6, 7,
  ]);
  expect(nextActiveStep(7)).toBe(7);
});
