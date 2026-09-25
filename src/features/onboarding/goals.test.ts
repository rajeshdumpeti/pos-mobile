import { goalDraftFromResource, serializeGoals } from './goals';

const all = [
  'target_weight',
  'daily_protein_grams',
  'daily_water',
  'daily_calories_kcal',
  'daily_steps',
  'workouts_per_week',
  'focus_minutes_per_day',
  'target_sleep_minutes',
  'budget_target',
] as const;

test('renders and serializes only configured goal fields with exact strings and integers', () => {
  const result = serializeGoals(
    {
      target_weight: '72.50',
      daily_protein_grams: '120.25',
      daily_steps: '8000',
      budget_target: '0',
      daily_water: '2.75',
    },
    ['target_weight', 'daily_protein_grams', 'daily_steps', 'budget_target', 'daily_water'],
    'metric',
    'USD',
  );
  expect(result.errors).toEqual({});
  expect(result.goals).toEqual({
    target_weight: { value: '72.50', unit: 'kg' },
    daily_protein_grams: '120.25',
    daily_steps: 8000,
    budget_target: { amount: '0', currency: 'USD' },
    daily_water: { value: '2.75', unit: 'liters' },
  });
  expect(result.goals).not.toHaveProperty('workouts_per_week');
});

test('empty optional values are omitted and allow a goals-step skip', () => {
  expect(
    serializeGoals(Object.fromEntries(all.map((field) => [field, ''])), all, 'imperial', 'GBP'),
  ).toEqual({ goals: {}, errors: {} });
});

test('preserves allowed zero and rejects zero for positive goals', () => {
  expect(
    serializeGoals(
      { workouts_per_week: '0', focus_minutes_per_day: '0', budget_target: '0' },
      ['workouts_per_week', 'focus_minutes_per_day', 'budget_target'],
      'metric',
      'EUR',
    ).goals,
  ).toEqual({
    workouts_per_week: 0,
    focus_minutes_per_day: 0,
    budget_target: { amount: '0', currency: 'EUR' },
  });
  const { errors } = serializeGoals(
    {
      daily_steps: '0',
      target_weight: '0',
      daily_water: '0',
      daily_protein_grams: '0',
      target_sleep_minutes: '0',
    },
    ['daily_steps', 'target_weight', 'daily_water', 'daily_protein_grams', 'target_sleep_minutes'],
    'metric',
    'USD',
  );
  expect(Object.keys(errors)).toHaveLength(5);
});

test.each([
  ['negative', { daily_steps: '-1' }, ['daily_steps']],
  ['non numeric', { daily_steps: 'one', target_weight: 'NaN' }, ['daily_steps', 'target_weight']],
  ['non finite', { daily_protein_grams: 'Infinity' }, ['daily_protein_grams']],
  ['fractional integer', { workouts_per_week: '1.5' }, ['workouts_per_week']],
  [
    'above maximum',
    { workouts_per_week: '8', focus_minutes_per_day: '1441', target_sleep_minutes: '1441' },
    ['workouts_per_week', 'focus_minutes_per_day', 'target_sleep_minutes'],
  ],
] as const)('rejects %s values', (_name, draft, fields) => {
  const result = serializeGoals(draft, fields, 'metric', 'USD');
  expect(Object.keys(result.errors)).toEqual(fields);
  expect(result.goals).toEqual({});
});

test('hydrates exact authoritative values without invented defaults', () => {
  expect(
    goalDraftFromResource({
      target_weight: { value: '65.20', unit: 'kg' },
      focus_minutes_per_day: 0,
      budget_target: { amount: '400.00', currency: 'USD' },
    }),
  ).toEqual({ target_weight: '65.20', focus_minutes_per_day: '0', budget_target: '400.00' });
});

test('uses imperial measurement units without altering decimal text', () => {
  expect(
    serializeGoals(
      { target_weight: '165.00', daily_water: '80.5' },
      ['target_weight', 'daily_water'],
      'imperial',
      'USD',
    ).goals,
  ).toEqual({
    target_weight: { value: '165.00', unit: 'lb' },
    daily_water: { value: '80.5', unit: 'fluid_ounces' },
  });
});
