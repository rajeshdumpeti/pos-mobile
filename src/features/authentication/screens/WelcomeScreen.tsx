import React, { useState } from 'react';

import { AppText, Button, Card, Stack } from '@/design-system';
import {
  AuthIllustration,
  AuthDemoProvider,
  AuthProviderDemoSheet,
  AuthQuickAccessSheet,
  AuthScaffold,
  AuthSocialButton,
  AuthTextButton,
} from '@/features/authentication/components';
import { authRoutes } from '@/features/authentication/constants/authentication';

import { AuthScreenNavigation } from './types';

export function WelcomeScreen({ onNavigate }: AuthScreenNavigation) {
  const [quickAccessVisible, setQuickAccessVisible] = useState(false);
  const [demoProvider, setDemoProvider] = useState<AuthDemoProvider | null>(null);
  return (
    <AuthScaffold
      title="Welcome Back"
      subtitle="Continue your journey."
      illustration={<AuthIllustration kind="brand" accessibilityLabel="POS leaf security mark" />}
    >
      <Card variant="elevated">
        <Stack gap="sm">
          <AuthSocialButton
            icon="apple"
            label="Continue with Apple"
            onPress={() => setDemoProvider('Apple')}
          />
          <AuthSocialButton
            icon="google"
            label="Continue with Google"
            onPress={() => setDemoProvider('Google')}
          />
          <AuthSocialButton
            icon="email"
            label="Continue with Email"
            onPress={() => onNavigate(authRoutes.signIn)}
          />
          <Stack
            direction="horizontal"
            gap="xs"
            align="center"
            justify="center"
            style={{ flexWrap: 'wrap' }}
          >
            <AppText color="secondary">New to POS?</AppText>
            <AuthTextButton
              label="Create Account"
              onPress={() => onNavigate(authRoutes.createAccount)}
            />
          </Stack>
        </Stack>
      </Card>
      <Button
        variant="ghost"
        label="Preview authentication flow"
        onPress={() => setQuickAccessVisible(true)}
      />
      <AuthQuickAccessSheet
        visible={quickAccessVisible}
        onDismiss={() => setQuickAccessVisible(false)}
        onNavigate={onNavigate}
      />
      <AuthProviderDemoSheet
        provider={demoProvider}
        onDismiss={() => setDemoProvider(null)}
        onContinue={() => onNavigate(authRoutes.success)}
      />
    </AuthScaffold>
  );
}
