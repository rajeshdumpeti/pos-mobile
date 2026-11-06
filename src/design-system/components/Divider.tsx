import React from 'react';
import { View } from 'react-native';
import { useTheme } from '@/design-system/theme';
export function Divider({ className }: { className?: string }) {
  const theme = useTheme();
  return (
    <View
      accessibilityElementsHidden
      className={className}
      importantForAccessibility="no-hide-descendants"
      style={{ height: 1, backgroundColor: theme.colors.divider }}
    />
  );
}
