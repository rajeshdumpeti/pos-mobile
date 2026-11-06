import '../global.css';

import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';

import { useTheme } from '@/design-system/theme';
import { AppProviders } from '@/providers/AppProviders';
import { PasswordResetLinkIngress } from '@/features/auth/integration';

function ThemedRootNavigator() {
  const theme = useTheme();
  return (
    <>
      <PasswordResetLinkIngress />
      <StatusBar style={theme.isDark ? 'light' : 'dark'} />
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="index" />
        <Stack.Screen name="(auth)" />
        <Stack.Screen name="(onboarding)" />
        <Stack.Screen name="(app)" />
        <Stack.Screen name="+not-found" />
      </Stack>
    </>
  );
}

export default function RootLayout() {
  return (
    <AppProviders>
      <ThemedRootNavigator />
    </AppProviders>
  );
}
