import { useState } from 'react';
import { AppText, Card } from '@/design-system';
import { AuthScaffold } from '../components/AuthScaffold';
import { AuthAction } from '../components/AuthAction';
import { EmailField } from '../components/AuthFields';

export function ForgotPasswordScreen() {
  const [email, setEmail] = useState('');
  const validEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
  return (
    <AuthScaffold
      modal
      title="Forgot Password?"
      subtitle="A fresh start is within reach. Enter your email to request reset instructions."
      footer={
        <AuthAction
          label="Request Reset Instructions"
          disabled={!validEmail}
          onPress={validEmail ? () => undefined : undefined}
        />
      }
    >
      <EmailField value={email} onChangeText={setEmail} />
      <Card>
        <AppText color="secondary">If that address is eligible, instructions will be sent.</AppText>
      </Card>
    </AuthScaffold>
  );
}
