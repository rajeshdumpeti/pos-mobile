import { useState } from 'react';
import { useRouter } from 'expo-router';
import { AuthScaffold } from '../components/AuthScaffold';
import { AuthAction } from '../components/AuthAction';
import { EmailField, PasswordField } from '../components/AuthFields';

export function SignInScreen() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const ready = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim()) && Boolean(password);
  return (
    <AuthScaffold
      title="Sign In"
      subtitle="Welcome back. Make space for what matters."
      footer={
        <>
          <AuthAction
            label="Sign In"
            disabled={!ready}
            onPress={ready ? () => undefined : undefined}
          />
          <AuthAction
            label="Create Account"
            variant="ghost"
            onPress={() => router.push('/(auth)/create-account')}
          />
        </>
      }
    >
      <EmailField value={email} onChangeText={setEmail} />
      <PasswordField
        label="Password"
        value={password}
        onChangeText={setPassword}
        autoComplete="current-password"
        textContentType="password"
      />
      <AuthAction
        label="Forgot Password?"
        variant="ghost"
        onPress={() => router.push('/(auth)/forgot-password')}
      />
    </AuthScaffold>
  );
}
