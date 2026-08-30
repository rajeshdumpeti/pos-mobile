import React, { useState } from 'react';

import { Button, Card, Stack, TextInput } from '@/design-system';
import {
  AuthIllustration,
  AuthScaffold,
  AuthStatusSurface,
} from '@/features/authentication/components';
import { authRoutes } from '@/features/authentication/constants/authentication';
import { isValidEmail } from '@/features/authentication/validation/authValidation';

import { AuthScreenNavigation } from './types';

export function ForgotPasswordScreen({ onNavigate, onBack }: AuthScreenNavigation) {
  const [email, setEmail] = useState('');
  const [error, setError] = useState<string>();
  const [sent, setSent] = useState(false);

  const submit = () => {
    if (!isValidEmail(email)) {
      setError('Enter a valid email address.');
      return;
    }
    setError(undefined);
    setSent(true);
  };

  return (
    <AuthScaffold
      title="Forgot Password"
      subtitle="We’ll help you return securely."
      onBack={onBack}
      illustration={<AuthIllustration kind="security" accessibilityLabel="Secure recovery key" />}
    >
      <Card>
        <Stack gap="sm">
          <TextInput
            label="Email"
            value={email}
            error={error}
            autoCapitalize="none"
            keyboardType="email-address"
            onChangeText={setEmail}
          />
          {sent ? (
            <AuthStatusSurface
              state="passwordResetSent"
              onAction={() => onNavigate(authRoutes.resetPassword)}
            />
          ) : (
            <Button label="Send Reset Link" onPress={submit} />
          )}
        </Stack>
      </Card>
    </AuthScaffold>
  );
}
