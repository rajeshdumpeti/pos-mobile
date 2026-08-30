import React, { useEffect, useState } from 'react';

import { Button, Card, Stack, TextInput } from '@/design-system';
import {
  AuthCheckbox,
  AuthDemoProvider,
  AuthInfoSheet,
  AuthProviderDemoSheet,
  AuthScaffold,
  AuthSocialButton,
  AuthStatusSurface,
  AuthTextButton,
  PasswordField,
} from '@/features/authentication/components';
import {
  AuthPresentationState,
  authRoutes,
  demoCredentials,
} from '@/features/authentication/constants/authentication';
import { validateSignIn } from '@/features/authentication/validation/authValidation';

import { AuthScreenNavigation } from './types';

export function SignInScreen({ onNavigate, onBack }: AuthScreenNavigation) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});
  const [state, setState] = useState<AuthPresentationState | null>(null);
  const [forgotVisible, setForgotVisible] = useState(false);
  const [demoProvider, setDemoProvider] = useState<AuthDemoProvider | null>(null);
  const [submittedCredentials, setSubmittedCredentials] = useState<{
    email: string;
    password: string;
  } | null>(null);
  const isSigningIn = state === 'signingIn';

  useEffect(() => {
    if (state !== 'signingIn' || !submittedCredentials) return;
    const timer = setTimeout(() => {
      if (
        submittedCredentials.email === demoCredentials.email &&
        submittedCredentials.password === demoCredentials.password
      ) {
        onNavigate(authRoutes.biometricSetup);
      } else {
        setState('invalidCredentials');
      }
    }, 500);
    return () => clearTimeout(timer);
  }, [onNavigate, state, submittedCredentials]);

  const submit = () => {
    const nextErrors = validateSignIn(email, password);
    setErrors(nextErrors);
    if (!nextErrors.email && !nextErrors.password) {
      setSubmittedCredentials({ email: email.trim().toLowerCase(), password });
      setState('signingIn');
    }
  };

  return (
    <AuthScaffold
      title="Sign In"
      subtitle="Your day is waiting."
      onBack={onBack}
      backDisabled={isSigningIn}
    >
      <Card>
        <Stack gap="sm">
          <TextInput
            label="Email"
            value={email}
            error={errors.email}
            autoCapitalize="none"
            keyboardType="email-address"
            autoComplete="email"
            disabled={isSigningIn}
            onChangeText={setEmail}
          />
          <PasswordField
            label="Password"
            value={password}
            error={errors.password}
            autoComplete="current-password"
            disabled={isSigningIn}
            onChangeText={setPassword}
          />
          <Stack
            direction="horizontal"
            align="center"
            justify="space-between"
            style={{ flexWrap: 'wrap' }}
          >
            <AuthCheckbox
              checked={rememberMe}
              label="Remember Me"
              disabled={isSigningIn}
              onPress={() => setRememberMe((value) => !value)}
            />
            <AuthTextButton
              label="Forgot Password"
              disabled={isSigningIn}
              onPress={() => setForgotVisible(true)}
            />
          </Stack>
          {state ? (
            <AuthStatusSurface
              state={state}
              actionLabel={state === 'signingIn' ? 'Cancel' : undefined}
              onAction={() => {
                if (state === 'invalidCredentials') {
                  onNavigate(authRoutes.forgotPassword);
                  return;
                }
                setSubmittedCredentials(null);
                setState(null);
              }}
            />
          ) : null}
          <Button label="Sign In" loading={state === 'signingIn'} onPress={submit} />
          <AuthSocialButton
            icon="apple"
            label="Continue with Apple"
            disabled={isSigningIn}
            onPress={() => setDemoProvider('Apple')}
          />
          <AuthSocialButton
            icon="google"
            label="Continue with Google"
            disabled={isSigningIn}
            onPress={() => setDemoProvider('Google')}
          />
          <AuthTextButton
            label="Preview security states"
            disabled={isSigningIn}
            onPress={() => onNavigate(authRoutes.preview)}
          />
        </Stack>
      </Card>
      <AuthInfoSheet
        kind="forgotPassword"
        visible={forgotVisible}
        onDismiss={() => setForgotVisible(false)}
        onAction={() => onNavigate(authRoutes.forgotPassword)}
      />
      <AuthProviderDemoSheet
        provider={demoProvider}
        onDismiss={() => setDemoProvider(null)}
        onContinue={() => onNavigate(authRoutes.success)}
      />
    </AuthScaffold>
  );
}
