import { Link, Stack } from 'expo-router';

import { AppText, Screen, Stack as ContentStack } from '@/design-system';
import { useTheme } from '@/design-system/theme';

export default function NotFoundRoute() {
  const theme = useTheme();

  return (
    <>
      <Stack.Screen options={{ title: 'Not found', headerShown: true }} />
      <Screen scroll={false}>
        <ContentStack align="center" justify="center" style={{ flex: 1 }}>
          <AppText variant="title" accessibilityRole="header">
            This page is unavailable
          </AppText>
          <Link
            href="/"
            accessibilityRole="link"
            style={{
              minHeight: theme.accessibility.minimumTouchTarget,
              padding: theme.spacing.sm,
              color: theme.colors.accentPrimary,
              fontWeight: theme.fontWeights.bold,
            }}
          >
            Return to Welcome
          </Link>
        </ContentStack>
      </Screen>
    </>
  );
}
