import React from 'react';
import { ActivityIndicator } from 'react-native';

import { useTheme } from '@/design-system/theme';
import { AppText } from './AppText';
import { Stack } from './Stack';

export function LoadingIndicator({
  label = 'Loading',
  inverse = false,
}: {
  label?: string;
  inverse?: boolean;
}) {
  const theme = useTheme();
  return (
    <Stack
      direction="horizontal"
      gap="xs"
      align="center"
      accessible
      accessibilityRole="progressbar"
      accessibilityLabel={label}
    >
      <ActivityIndicator color={inverse ? theme.colors.textInverse : theme.colors.accentPrimary} />
      <AppText variant="label" color={inverse ? 'inverse' : 'secondary'}>
        {label}
      </AppText>
    </Stack>
  );
}
