import { useState } from 'react';
import { useRouter } from 'expo-router';
import { TextInput } from '@/design-system';
import { routes } from '@/navigation/routes';
import { AuthScaffold } from '../components/AuthScaffold';
import { AuthAction } from '../components/AuthAction';
import { EmailField, PasswordField } from '../components/AuthFields';
import { LegalBoundary } from '../components/LegalBoundary';

export function CreateAccountScreen() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmation, setConfirmation] = useState('');
  const validEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
  const ready = Boolean(name.trim() && validEmail && password && password === confirmation);
  return (
    <AuthScaffold
      title="Create Account"
      subtitle="Start building a life with more intention."
      footer={
        <>
          <AuthAction
            label="Create Account"
            disabled={!ready}
            onPress={ready ? () => undefined : undefined}
          />
          <AuthAction
            label="Sign In"
            variant="ghost"
            onPress={() => router.replace(routes.auth.signIn)}
          />
        </>
      }
    >
      <TextInput
        label="Full name"
        value={name}
        onChangeText={setName}
        autoComplete="name"
        textContentType="name"
        autoCapitalize="words"
      />
      <EmailField value={email} onChangeText={setEmail} />
      <PasswordField
        label="Password"
        value={password}
        onChangeText={setPassword}
        autoComplete="new-password"
        textContentType="newPassword"
      />
      <PasswordField
        label="Confirm password"
        value={confirmation}
        onChangeText={setConfirmation}
        autoComplete="new-password"
        textContentType="newPassword"
      />
      <LegalBoundary />
    </AuthScaffold>
  );
}
