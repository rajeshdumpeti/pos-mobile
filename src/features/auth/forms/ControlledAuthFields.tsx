import React from 'react';
import { Control, Controller, FieldPath, FieldValues } from 'react-hook-form';

import { TextInput, TextInputProps } from '@/design-system';

import { EmailField, PasswordField } from '../components/AuthFields';
import { CodeEntry } from '../components/CodeEntry';

type ControlledFieldProps<TValues extends FieldValues> = {
  control: Control<TValues>;
  name: FieldPath<TValues>;
};

export function ControlledTextField<TValues extends FieldValues>({
  control,
  name,
  label,
  ...props
}: ControlledFieldProps<TValues> &
  Omit<TextInputProps, 'value' | 'onChangeText' | 'onBlur' | 'error'>) {
  return (
    <Controller
      control={control}
      name={name}
      render={({ field, fieldState }) => (
        <TextInput
          {...props}
          ref={field.ref}
          label={label}
          accessibilityLabel={label}
          accessibilityHint="Required"
          value={typeof field.value === 'string' ? field.value : ''}
          onChangeText={field.onChange}
          onBlur={field.onBlur}
          error={fieldState.error?.message}
        />
      )}
    />
  );
}

export function ControlledEmailField<TValues extends FieldValues>({
  control,
  name,
}: ControlledFieldProps<TValues>) {
  return (
    <Controller
      control={control}
      name={name}
      render={({ field, fieldState }) => (
        <EmailField
          ref={field.ref}
          value={typeof field.value === 'string' ? field.value : ''}
          onChangeText={field.onChange}
          onBlur={field.onBlur}
          error={fieldState.error?.message}
          accessibilityLabel="Email"
          accessibilityHint="Required"
        />
      )}
    />
  );
}

export function ControlledPasswordField<TValues extends FieldValues>({
  control,
  name,
  label,
  ...props
}: ControlledFieldProps<TValues> &
  Omit<TextInputProps, 'value' | 'onChangeText' | 'onBlur' | 'error'>) {
  return (
    <Controller
      control={control}
      name={name}
      render={({ field, fieldState }) => (
        <PasswordField
          {...props}
          ref={field.ref}
          label={label}
          accessibilityLabel={label}
          accessibilityHint="Required"
          value={typeof field.value === 'string' ? field.value : ''}
          onChangeText={field.onChange}
          onBlur={field.onBlur}
          error={fieldState.error?.message}
        />
      )}
    />
  );
}

export function ControlledCodeEntry<TValues extends FieldValues>({
  control,
  name,
}: ControlledFieldProps<TValues>) {
  return (
    <Controller
      control={control}
      name={name}
      render={({ field, fieldState }) => (
        <CodeEntry
          value={typeof field.value === 'string' ? field.value : ''}
          onChangeText={field.onChange}
          onBlur={field.onBlur}
          error={fieldState.error?.message}
        />
      )}
    />
  );
}
