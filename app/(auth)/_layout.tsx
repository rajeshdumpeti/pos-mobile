import { Stack } from 'expo-router';
import { useTheme } from '@/design-system/theme';
import { useAuthReducedMotion } from '@/features/auth/presentation/useAuthMotion';

export default function AuthLayout() {
  const theme = useTheme();
  const reduced = useAuthReducedMotion();
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        animation: reduced ? 'none' : 'fade',
        contentStyle: { backgroundColor: theme.colors.backgroundPrimary },
        gestureEnabled: true,
      }}
    >
      <Stack.Screen name="welcome" />
      <Stack.Screen
        name="forgot-password"
        options={{ presentation: 'modal', animation: reduced ? 'none' : 'slide_from_bottom' }}
      />
    </Stack>
  );
}
