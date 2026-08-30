import { Stack } from 'expo-router';

import { useTheme } from '@/design-system/theme';

export default function AuthLayout() {
  const theme = useTheme();
  return (
    <Stack
      initialRouteName="welcome"
      screenOptions={{
        headerShown: false,
        animation: 'slide_from_right',
        contentStyle: { backgroundColor: theme.colors.backgroundPrimary },
      }}
    />
  );
}
