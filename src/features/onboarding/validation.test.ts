import { requireOnboardingResource } from './validation';
const valid = {
  contract_version: '1.0',
  version: 2,
  status: 'in_progress',
  priority_life_areas: ['health'],
  unit_preference: { value: 'metric', confirmed: true },
  currency_preference: { value: 'USD', confirmed: true },
  goals: {},
  integration_preferences: {},
  notification_preferences: {},
  completed_at: null,
  configuration: {
    priority_life_areas: ['health'],
    unit_systems: ['metric'],
    currencies: ['USD'],
    optional_goal_fields: [],
    integration_identifiers: [],
    notification_identifiers: [],
  },
  requirements: { ready_to_complete: true },
};
test('accepts the structural authoritative response boundary', () =>
  expect(requireOnboardingResource(valid)).toBe(valid));
test.each([
  null,
  {},
  { ...valid, contract_version: '2.0' },
  { ...valid, version: -1 },
  { ...valid, status: 'done' },
  { ...valid, priority_life_areas: 'health' },
])('rejects malformed success without accepting query state', (value) =>
  expect(() => requireOnboardingResource(value)).toThrow('Invalid onboarding response'),
);
