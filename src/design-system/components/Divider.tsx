import React from 'react';
import { View } from 'react-native';
import { useTheme } from '@/design-system/theme';
export function Divider() {
  const theme = useTheme();
  return (
    <View
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      style={{ height: 1, backgroundColor: theme.colors.divider }}
    />
  );
}
