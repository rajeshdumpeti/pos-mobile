import { Tabs } from 'expo-router';

import { POSIcon, POSIconName } from '@/design-system/icons';
import { useTheme } from '@/design-system/theme';

const icons = {
  index: 'today',
  plan: 'calendar',
  log: 'log',
  focus: 'focus',
  review: 'review',
} as const satisfies Record<string, POSIconName>;

export default function TabsLayout() {
  const theme = useTheme();

  return (
    <Tabs
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: theme.colors.accentPrimary,
        tabBarInactiveTintColor: theme.colors.textMuted,
        tabBarLabelStyle: theme.typography.caption,
        tabBarStyle: {
          backgroundColor: theme.colors.surfacePrimary,
          borderTopColor: theme.colors.borderDefault,
        },
        tabBarIcon: ({ color, size }) => (
          <POSIcon name={icons[route.name as keyof typeof icons]} color={color} size={size} />
        ),
      })}
    >
      <Tabs.Screen name="index" options={{ title: 'Today' }} />
      <Tabs.Screen name="plan" options={{ title: 'Plan' }} />
      <Tabs.Screen name="log" options={{ title: 'Log' }} />
      <Tabs.Screen name="focus" options={{ title: 'Focus' }} />
      <Tabs.Screen name="review" options={{ title: 'Review' }} />
    </Tabs>
  );
}
