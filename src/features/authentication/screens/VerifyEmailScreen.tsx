import React, { useState } from 'react';

import { Button, Card, Stack, TextInput } from '@/design-system';
import {
  AuthIllustration,
  AuthInfoSheet,
  AuthScaffold,
  AuthStatusSurface,
  AuthTextButton,
} from '@/features/authentication/components';
import { authRoutes, demoCredentials } from '@/features/authentication/constants/authentication';
import { useResendCountdown } from '@/features/authentication/hooks/useResendCountdown';

import { AuthScreenNavigation } from './types';

export function VerifyEmailScreen({ onNavigate, onBack }: AuthScreenNavigation) {
  const [code, setCode] = useState('');
  const [error, setError] = useState(false);
  const [changeEmailVisible, setChangeEmailVisible] = useState(false);
  const { remainingSeconds, canResend, restart } = useResendCountdown();

  const submit = () => {
    if (code === demoCredentials.verificationCode) onNavigate(authRoutes.biometricSetup);
    else setError(true);
  };

  return (
    <AuthScaffold
      title="Verify Your Email"
      subtitle="Enter the six-digit code. Demo code: 123456."
      onBack={onBack}
      illustration={
        <AuthIllustration kind="email" accessibilityLabel="Protected email verification" />
      }
    >
      <Card>
        <Stack gap="sm">
          <TextInput
            label="Verification code"
            value={code}
            error={error ? 'Enter the latest six-digit code.' : undefined}
            keyboardType="number-pad"
            maxLength={6}
            textContentType="oneTimeCode"
            onChangeText={(value) => {
              setCode(value.replace(/\D/g, ''));
              setError(false);
            }}
            style={{ textAlign: 'center', letterSpacing: 10 }}
          />
          {error ? (
            <AuthStatusSurface
              state="emailNotVerified"
              onAction={() => {
                restart();
                setError(false);
              }}
            />
          ) : null}
          <Button label="Continue" disabled={code.length !== 6} onPress={submit} />
          <Button
            variant="secondary"
            label={canResend ? 'Resend Code' : `Resend code in ${remainingSeconds}s`}
            disabled={!canResend}
            onPress={restart}
          />
          <AuthTextButton label="Change Email" onPress={() => setChangeEmailVisible(true)} />
        </Stack>
      </Card>
      <AuthInfoSheet
        kind="changeEmail"
        visible={changeEmailVisible}
        onDismiss={() => setChangeEmailVisible(false)}
        onAction={() => onNavigate(authRoutes.createAccount)}
      />
    </AuthScaffold>
  );
}
