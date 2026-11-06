import React from 'react';
import { ActivityIndicator, View } from 'react-native';
import { Redirect, usePathname } from 'expo-router';

import { AppText, Screen } from '@/design-system';
import { useTheme } from '@/design-system/theme';
import { ConnectedResetPasswordScreen } from '@/features/auth/screens/ResetPasswordScreen';

import { useNavigationAccess } from './NavigationAccessProvider';
import { shouldRedirectAuthRoute } from './navigationPolicy';
import { routes } from './routes';

export function NavigationRestoringScreen() {
  const theme = useTheme();
  return (
    <Screen scroll={false} testID="navigation-restoring">
      <View
        accessible
        accessibilityRole="progressbar"
        accessibilityLabel="Restoring access"
        accessibilityLiveRegion="polite"
        style={{ flex: 1, alignItems: 'center', justifyContent: 'center', gap: theme.spacing.sm }}
      >
        <ActivityIndicator color={theme.colors.accentPrimary} />
        <AppText color="secondary">Preparing POS…</AppText>
      </View>
    </Screen>
  );
}

export function AuthRouteBoundary({ children }: React.PropsWithChildren) {
  const status = useNavigationAccess();
  const pathname = usePathname();

  if (status === 'checking') return <NavigationRestoringScreen />;
  if (shouldRedirectAuthRoute(status, pathname))
    return <Redirect href={status === 'onboarding' ? routes.onboarding.index : routes.app.index} />;
  return children;
}

export function ProtectedAppBoundary({ children }: React.PropsWithChildren) {
  const status = useNavigationAccess();
  if (status === 'checking') return <NavigationRestoringScreen />;
  if (status === 'signedOut') return <Redirect href={routes.auth.welcome} />;
  if (status === 'onboarding') return <Redirect href={routes.onboarding.index} />;
  return children;
}

export function OnboardingBoundary({ children }: React.PropsWithChildren) {
  const status = useNavigationAccess();
  if (status === 'checking') return <NavigationRestoringScreen />;
  if (status === 'signedOut') return <Redirect href={routes.auth.welcome} />;
  if (status === 'signedIn') return <Redirect href={routes.app.index} />;
  return children;
}

export function ResetPasswordRouteBoundary() {
  return <ConnectedResetPasswordScreen />;
}
