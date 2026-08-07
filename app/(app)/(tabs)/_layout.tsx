import { Ionicons } from '@expo/vector-icons';
import { Tabs } from 'expo-router';

import { typography, usePOSTheme } from '@/theme';

const icons = {
  index: 'sunny-outline',
  plan: 'calendar-outline',
  log: 'add-circle-outline',
  focus: 'timer-outline',
  review: 'stats-chart-outline',
} as const;

export default function TabsLayout() {
  const { colors } = usePOSTheme();

  return (
    <Tabs
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: colors.action.primary,
        tabBarInactiveTintColor: colors.text.muted,
        tabBarLabelStyle: typography.tabLabel,
        tabBarStyle: {
          backgroundColor: colors.surface.primary,
          borderTopColor: colors.border.default,
        },
        tabBarIcon: ({ color, size }) => (
          <Ionicons name={icons[route.name as keyof typeof icons]} color={color} size={size} />
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
