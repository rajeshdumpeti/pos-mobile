import { Stack, useRouter } from 'expo-router';

import { AppText, Button, Screen, Stack as ContentStack } from '@/design-system';
import {
  NavigationRestoringScreen,
  resolveUnknownRouteDestination,
  useNavigationAccess,
} from '@/navigation';

export default function NotFoundRoute() {
  const access = useNavigationAccess();
  const router = useRouter();
  if (access === 'checking') return <NavigationRestoringScreen />;
  const destination = resolveUnknownRouteDestination(access);

  return (
    <>
      <Stack.Screen options={{ title: 'Not found', headerShown: true }} />
      <Screen scroll={false}>
        <ContentStack align="center" justify="center" style={{ flex: 1 }}>
          <AppText variant="title" accessibilityRole="header">
            This page is unavailable
          </AppText>
          <AppText color="secondary">Return to a safe POS starting point.</AppText>
          <Button
            label={access === 'signedIn' ? 'Return to POS' : 'Return to Welcome'}
            onPress={() => router.replace(destination)}
          />
        </ContentStack>
      </Screen>
    </>
  );
}
