import type { Currency, Goals, OnboardingResource, UnitSystem } from './types';

export type GoalField = OnboardingResource['configuration']['optional_goal_fields'][number];
export type GoalDraft = Partial<Record<GoalField, string>>;
export type GoalErrors = Partial<Record<GoalField, string>>;

const integerBounds: Partial<Record<GoalField, [number, number, boolean]>> = {
  daily_calories_kcal: [1, 10_000_000, false],
  daily_steps: [1, 100_000_000, false],
  workouts_per_week: [0, 7, true],
  focus_minutes_per_day: [0, 1440, true],
  target_sleep_minutes: [1, 1440, false],
};
const decimalFields = new Set<GoalField>([
  'target_weight',
  'daily_protein_grams',
  'daily_water',
  'budget_target',
]);
const decimalPattern = /^(?:0|[1-9]\d*)(?:\.\d+)?$/;

export function goalDraftFromResource(goals: OnboardingResource['goals']): GoalDraft {
  return {
    ...(goals.target_weight ? { target_weight: goals.target_weight.value } : {}),
    ...(goals.daily_protein_grams != null
      ? { daily_protein_grams: goals.daily_protein_grams }
      : {}),
    ...(goals.daily_water ? { daily_water: goals.daily_water.value } : {}),
    ...(goals.daily_calories_kcal != null
      ? { daily_calories_kcal: String(goals.daily_calories_kcal) }
      : {}),
    ...(goals.daily_steps != null ? { daily_steps: String(goals.daily_steps) } : {}),
    ...(goals.workouts_per_week != null
      ? { workouts_per_week: String(goals.workouts_per_week) }
      : {}),
    ...(goals.focus_minutes_per_day != null
      ? { focus_minutes_per_day: String(goals.focus_minutes_per_day) }
      : {}),
    ...(goals.target_sleep_minutes != null
      ? { target_sleep_minutes: String(goals.target_sleep_minutes) }
      : {}),
    ...(goals.budget_target ? { budget_target: goals.budget_target.amount } : {}),
  };
}

export function serializeGoals(
  draft: GoalDraft,
  supported: readonly GoalField[],
  unit: UnitSystem,
  currency: Currency,
): { goals: Goals; errors: GoalErrors } {
  const goals: Goals = {},
    errors: GoalErrors = {};
  for (const field of supported) {
    const raw = draft[field]?.trim() ?? '';
    if (!raw) continue;
    const bounds = integerBounds[field];
    if (bounds) {
      if (!/^\d+$/.test(raw) || !Number.isSafeInteger(Number(raw))) {
        errors[field] = 'Enter a whole number.';
        continue;
      }
      const value = Number(raw),
        [minimum, maximum] = bounds;
      if (value < minimum || value > maximum) {
        errors[field] = `Enter a value from ${minimum} to ${maximum}.`;
        continue;
      }
      (goals as Record<string, unknown>)[field] = value;
      continue;
    }
    if (decimalFields.has(field)) {
      if (!decimalPattern.test(raw) || !Number.isFinite(Number(raw))) {
        errors[field] = 'Enter a valid number.';
        continue;
      }
      if (field !== 'budget_target' && Number(raw) <= 0) {
        errors[field] = 'Enter a value greater than zero.';
        continue;
      }
      if (field === 'target_weight')
        goals.target_weight = { value: raw, unit: unit === 'metric' ? 'kg' : 'lb' };
      else if (field === 'daily_water')
        goals.daily_water = { value: raw, unit: unit === 'metric' ? 'liters' : 'fluid_ounces' };
      else if (field === 'budget_target') goals.budget_target = { amount: raw, currency };
      else goals.daily_protein_grams = raw;
    }
  }
  return { goals, errors };
}

export const goalLabels: Record<GoalField, string> = {
  target_weight: 'Target weight',
  daily_protein_grams: 'Daily protein',
  daily_water: 'Daily water',
  daily_calories_kcal: 'Daily calories',
  daily_steps: 'Daily steps',
  workouts_per_week: 'Workouts per week',
  focus_minutes_per_day: 'Focus minutes per day',
  target_sleep_minutes: 'Target sleep minutes',
  budget_target: 'Budget target',
};
export function goalUnit(field: GoalField, unit: UnitSystem, currency: Currency) {
  if (field === 'target_weight') return unit === 'metric' ? 'kg' : 'lb';
  if (field === 'daily_water') return unit === 'metric' ? 'liters' : 'fluid ounces';
  if (field === 'daily_protein_grams') return 'grams';
  if (field === 'daily_calories_kcal') return 'kcal';
  if (field === 'budget_target') return currency;
  return undefined;
}
