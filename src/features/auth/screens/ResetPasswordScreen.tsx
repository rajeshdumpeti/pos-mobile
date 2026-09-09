import { useState } from 'react';
import { AppText, Card } from '@/design-system';
import { routes } from '@/navigation/routes';
import { AuthAction } from '../components/AuthAction';
import { PasswordField } from '../components/AuthFields';
import { PasswordProgress } from '../components/PasswordProgress';

import { AuthScaffold } from '../components/AuthScaffold';

export function ResetPasswordScreen({
  continuationAvailable = false,
}: {
  continuationAvailable?: boolean;
}) {
  const [password, setPassword] = useState('');
  const [confirmation, setConfirmation] = useState('');
  const ready = Boolean(continuationAvailable && password && password === confirmation);
  return (
    <AuthScaffold
      backFallback={routes.auth.signIn}
      title="Reset Password"
      subtitle="Choose a new password for your POS account."
      footer={
        <AuthAction
          label="Update Password"
          disabled={!ready}
          onPress={ready ? () => undefined : undefined}
        />
      }
    >
      {!continuationAvailable && (
        <Card>
          <AppText color="secondary">
            This reset link is unavailable. Return to Sign In and request a new link.
          </AppText>
        </Card>
      )}
      <PasswordField
        label="New password"
        value={password}
        onChangeText={setPassword}
        autoComplete="new-password"
        textContentType="newPassword"
      />
      <PasswordProgress password={password} />
      <PasswordField
        label="Confirm password"
        value={confirmation}
        onChangeText={setConfirmation}
        autoComplete="new-password"
        textContentType="newPassword"
      />
    </AuthScaffold>
  );
}
