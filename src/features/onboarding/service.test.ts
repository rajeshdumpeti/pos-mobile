import { createOnboardingService } from './service';

test('uses the authoritative onboarding methods, paths, and flat expected version', async () => {
  const request = jest.fn().mockResolvedValue({
    contract_version: '1.0',
    version: 0,
    status: 'not_started',
    priority_life_areas: [],
    unit_preference: { value: null, confirmed: false },
    currency_preference: { value: null, confirmed: false },
    goals: {},
    integration_preferences: {},
    notification_preferences: {},
    completed_at: null,
    configuration: {
      priority_life_areas: [],
      unit_systems: [],
      currencies: [],
      optional_goal_fields: [],
      integration_identifiers: [],
      notification_identifiers: [],
    },
    requirements: { ready_to_complete: false },
  });
  const service = createOnboardingService(request);
  await service.get('credential');
  await service.patch('credential', { expected_version: 3, priority_life_areas: ['health'] });
  await service.complete('credential', 4);
  expect(request.mock.calls.map(([value]) => [value.method, value.path])).toEqual([
    ['GET', '/api/v1/onboarding'],
    ['PATCH', '/api/v1/onboarding'],
    ['POST', '/api/v1/onboarding/complete'],
  ]);
  expect(request.mock.calls[1][0].body).toEqual({
    expected_version: 3,
    priority_life_areas: ['health'],
  });
  expect(request.mock.calls[2][0].body).toEqual({ expected_version: 4 });
});
