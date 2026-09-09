import { useState } from 'react';
import { AuthScaffold } from '../components/AuthScaffold';
import { AuthAction } from '../components/AuthAction';
import { PasswordField } from '../components/AuthFields';
import { PasswordProgress } from '../components/PasswordProgress';

export function ResetPasswordScreen() {
  const [password, setPassword] = useState('');
  const [confirmation, setConfirmation] = useState('');
  const ready = Boolean(password && password === confirmation);
  return (
    <AuthScaffold
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
