import { Stack } from 'expo-router';
import { useReducedMotion } from '@/features/today/motion';
import { useTheme } from '@/design-system/theme';

import { ProtectedAppBoundary } from '@/navigation';
import { PlanningSessionScope } from '@/features/today/PlanningProvider';

export default function AppLayout() {
  const theme = useTheme(),
    { reduced } = useReducedMotion();
  return (
    <ProtectedAppBoundary>
      <PlanningSessionScope>
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
          <Stack.Screen
            name="plan-item-new"
            options={{
              presentation: 'modal',
              animation: reduced ? 'fade' : 'slide_from_bottom',
              contentStyle: { backgroundColor: theme.colors.backgroundPrimary },
            }}
          />
          <Stack.Screen name="plan-item" options={{ presentation: 'card' }} />
          <Stack.Screen
            name="plan-item-edit"
            options={{
              presentation: 'modal',
              animation: reduced ? 'fade' : 'slide_from_bottom',
              contentStyle: { backgroundColor: theme.colors.backgroundPrimary },
            }}
          />
        </Stack>
      </PlanningSessionScope>
    </ProtectedAppBoundary>
  );
}
