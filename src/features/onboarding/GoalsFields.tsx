import React from 'react';
import { TextInput } from '@/design-system';
import type { Currency, UnitSystem } from './types';
import { goalLabels, goalUnit, type GoalDraft, type GoalErrors, type GoalField } from './goals';

export function GoalsFields({
  supported,
  draft,
  errors,
  unit,
  currency,
  disabled,
  onChange,
}: {
  supported: readonly GoalField[];
  draft: GoalDraft;
  errors: GoalErrors;
  unit: UnitSystem;
  currency: Currency;
  disabled: boolean;
  onChange: (field: GoalField, value: string) => void;
}) {
  return (
    <>
      {supported.map((field) => (
        <TextInput
          key={field}
          label={goalLabels[field]}
          accessibilityLabel={goalLabels[field]}
          hint={`${goalUnit(field, unit, currency) ?? 'Optional'} · Optional`}
          error={errors[field]}
          value={draft[field] ?? ''}
          onChangeText={(value) => onChange(field, value)}
          keyboardType={
            [
              'daily_calories_kcal',
              'daily_steps',
              'workouts_per_week',
              'focus_minutes_per_day',
              'target_sleep_minutes',
            ].includes(field)
              ? 'number-pad'
              : 'decimal-pad'
          }
          disabled={disabled}
        />
      ))}
    </>
  );
}
