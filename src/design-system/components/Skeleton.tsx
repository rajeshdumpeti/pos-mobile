import React from 'react';
import { View, ViewStyle } from 'react-native';
import { useTheme } from '@/design-system/theme';
export function Skeleton({
  width = '100%',
  height = 16,
  radius = 'small',
  accessibilityLabel = 'Loading content',
  className,
}: {
  width?: ViewStyle['width'];
  height?: number;
  radius?: 'small' | 'medium' | 'pill';
  accessibilityLabel?: string;
  className?: string;
}) {
  const theme = useTheme();
  return (
    <View
      accessibilityRole="progressbar"
      accessibilityLabel={accessibilityLabel}
      className={className}
      style={{
        width,
        height,
        borderRadius: theme.radii[radius],
        backgroundColor: theme.colors.backgroundSecondary,
        opacity: theme.opacity.muted,
      }}
    />
  );
}
