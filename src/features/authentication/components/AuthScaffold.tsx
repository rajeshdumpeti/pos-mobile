import React from 'react';
import { View } from 'react-native';

import { AppText, IconButton, Screen, Stack } from '@/design-system';

export function AuthScaffold({
  title,
  subtitle,
  onBack,
  backDisabled = false,
  illustration,
  children,
}: React.PropsWithChildren<{
  title: string;
  subtitle: string;
  onBack?: () => void;
  backDisabled?: boolean;
  illustration?: React.ReactNode;
}>) {
  return (
    <Screen
      keyboardSafe
      contentContainerStyle={{ flexGrow: 1, justifyContent: 'center' }}
      testID="auth-screen"
    >
      <View className="w-full self-center" style={{ maxWidth: 520 }}>
        <Stack gap="lg">
          {onBack ? (
            <IconButton
              icon="back"
              accessibilityLabel="Go back"
              disabled={backDisabled}
              onPress={onBack}
            />
          ) : null}
          {illustration}
          <Stack gap="xs" align="center">
            <AppText variant="heading" accessibilityRole="header" style={{ textAlign: 'center' }}>
              {title}
            </AppText>
            <AppText color="secondary" style={{ textAlign: 'center' }}>
              {subtitle}
            </AppText>
          </Stack>
          {children}
        </Stack>
      </View>
    </Screen>
  );
}
