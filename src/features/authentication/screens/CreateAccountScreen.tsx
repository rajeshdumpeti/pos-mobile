import React, { useState } from 'react';

import { AppText, Button, Card, Stack, TextInput } from '@/design-system';
import {
  AuthCheckbox,
  AuthInfoSheet,
  AuthScaffold,
  AuthTextButton,
  PasswordField,
} from '@/features/authentication/components';
import { AuthSheetKind, authRoutes } from '@/features/authentication/constants/authentication';
import {
  CreateAccountErrors,
  CreateAccountValues,
  validateCreateAccount,
} from '@/features/authentication/validation/authValidation';

import { AuthScreenNavigation } from './types';

const initialValues: CreateAccountValues = {
  fullName: '',
  email: '',
  password: '',
  confirmPassword: '',
  acceptedTerms: false,
};

export function CreateAccountScreen({ onNavigate, onBack }: AuthScreenNavigation) {
  const [values, setValues] = useState(initialValues);
  const [errors, setErrors] = useState<CreateAccountErrors>({});
  const [sheet, setSheet] = useState<AuthSheetKind | null>(null);

  const update = <Key extends keyof CreateAccountValues>(
    key: Key,
    value: CreateAccountValues[Key],
  ) => setValues((current) => ({ ...current, [key]: value }));

  const submit = () => {
    const nextErrors = validateCreateAccount(values);
    setErrors(nextErrors);
    if (!Object.keys(nextErrors).length) onNavigate(authRoutes.verifyEmail);
  };

  return (
    <AuthScaffold
      title="Create Account"
      subtitle="Set up your calm, private space."
      onBack={onBack}
    >
      <Card>
        <Stack gap="sm">
          <TextInput
            label="Full name"
            value={values.fullName}
            error={errors.fullName}
            autoComplete="name"
            returnKeyType="next"
            onChangeText={(value) => update('fullName', value)}
          />
          <TextInput
            label="Email"
            value={values.email}
            error={errors.email}
            autoCapitalize="none"
            keyboardType="email-address"
            autoComplete="email"
            returnKeyType="next"
            onChangeText={(value) => update('email', value)}
          />
          <PasswordField
            label="Password"
            value={values.password}
            error={errors.password}
            autoComplete="new-password"
            onChangeText={(value) => update('password', value)}
          />
          <PasswordField
            label="Confirm password"
            value={values.confirmPassword}
            error={errors.confirmPassword}
            autoComplete="new-password"
            onChangeText={(value) => update('confirmPassword', value)}
          />
          <AuthCheckbox
            checked={values.acceptedTerms}
            label="I accept the Terms and Privacy Policy"
            onPress={() => update('acceptedTerms', !values.acceptedTerms)}
          />
          {errors.acceptedTerms ? (
            <AppText accessibilityRole="alert" color="danger" variant="caption">
              Error: {errors.acceptedTerms}
            </AppText>
          ) : null}
          <Stack direction="horizontal" gap="lg" justify="center" style={{ flexWrap: 'wrap' }}>
            <AuthTextButton label="Terms" onPress={() => setSheet('terms')} />
            <AuthTextButton label="Privacy" onPress={() => setSheet('privacy')} />
          </Stack>
          <Button label="Create Account" onPress={submit} />
          <Stack
            direction="horizontal"
            gap="xs"
            align="center"
            justify="center"
            style={{ flexWrap: 'wrap' }}
          >
            <AppText color="secondary">Already have an account?</AppText>
            <AuthTextButton label="Sign In" onPress={() => onNavigate(authRoutes.signIn)} />
          </Stack>
        </Stack>
      </Card>
      {sheet ? <AuthInfoSheet kind={sheet} visible onDismiss={() => setSheet(null)} /> : null}
    </AuthScaffold>
  );
}
