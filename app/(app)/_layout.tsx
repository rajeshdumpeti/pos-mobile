import { Stack } from 'expo-router';
import { useTheme } from '@/design-system/theme';

import { ProtectedAppBoundary } from '@/navigation';

export default function AppLayout() {
  const theme = useTheme();
  return (
    <ProtectedAppBoundary>
      <Stack
        screenOptions={{
          headerShown: false,
          animation: 'none',
          contentStyle: { backgroundColor: theme.colors.backgroundPrimary },
        }}
      >
        <Stack.Screen name="(tabs)" />
        <Stack.Screen
          name="notifications"
          options={{
            presentation: 'transparentModal',
            gestureEnabled: false,
            contentStyle: { backgroundColor: 'transparent' },
          }}
        />
        <Stack.Screen
          name="profile"
          options={{
            presentation: 'transparentModal',
            gestureEnabled: false,
            contentStyle: { backgroundColor: 'transparent' },
          }}
        />
        <Stack.Screen name="quick-log" options={{ presentation: 'card' }} />
      </Stack>
    </ProtectedAppBoundary>
  );
}
