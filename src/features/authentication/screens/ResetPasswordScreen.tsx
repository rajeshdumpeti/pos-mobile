import React, { useState } from 'react';

import { AppText, Button, Card, Stack } from '@/design-system';
import {
  AuthIllustration,
  AuthScaffold,
  AuthStatusSurface,
  PasswordField,
  PasswordStrength,
} from '@/features/authentication/components';
import { authRoutes } from '@/features/authentication/constants/authentication';
import { isStrongPassword } from '@/features/authentication/validation/authValidation';

import { AuthScreenNavigation } from './types';

export function ResetPasswordScreen({ onNavigate, onBack }: AuthScreenNavigation) {
  const [password, setPassword] = useState('');
  const [confirmation, setConfirmation] = useState('');
  const [error, setError] = useState<string>();
  const [updated, setUpdated] = useState(false);

  const submit = () => {
    if (!isStrongPassword(password)) {
      setError('Meet all three password requirements.');
      return;
    }
    if (confirmation !== password) {
      setError('Passwords must match.');
      return;
    }
    setError(undefined);
    setUpdated(true);
  };

  return (
    <AuthScaffold
      title="Reset Password"
      subtitle="Choose a strong password you can remember."
      onBack={onBack}
      illustration={<AuthIllustration kind="security" accessibilityLabel="Protected password" />}
    >
      <Card>
        <Stack gap="sm">
          <PasswordField label="New password" value={password} onChangeText={setPassword} />
          <PasswordStrength password={password} />
          <PasswordField
            label="Confirm new password"
            value={confirmation}
            onChangeText={setConfirmation}
          />
          {error ? (
            <AppText accessibilityRole="alert" color="danger" variant="caption">
              Error: {error}
            </AppText>
          ) : null}
          {updated ? (
            <AuthStatusSurface
              state="passwordUpdated"
              onAction={() => onNavigate(authRoutes.signIn)}
            />
          ) : (
            <Button label="Update Password" onPress={submit} />
          )}
        </Stack>
      </Card>
    </AuthScaffold>
  );
}
