import React from 'react';
import { View, ViewProps } from 'react-native';

import { RadiusToken, SpacingToken } from '@/design-system/tokens';
import { useTheme } from '@/design-system/theme';

type Surface =
  'background' | 'backgroundSecondary' | 'surface' | 'elevated' | 'glass' | 'transparent';
export type BoxProps = ViewProps & {
  padding?: SpacingToken;
  paddingHorizontal?: SpacingToken;
  paddingVertical?: SpacingToken;
  radius?: RadiusToken;
  surface?: Surface;
};

export function Box({
  padding,
  paddingHorizontal,
  paddingVertical,
  radius,
  surface = 'transparent',
  className,
  style,
  ...props
}: BoxProps) {
  const theme = useTheme();
  const surfaces = {
    background: theme.colors.backgroundPrimary,
    backgroundSecondary: theme.colors.backgroundSecondary,
    surface: theme.colors.surfacePrimary,
    elevated: theme.colors.surfaceElevated,
    glass: theme.colors.surfaceGlass,
    transparent: 'transparent',
  };
  return (
    <View
      className={className}
      style={[
        { backgroundColor: surfaces[surface] },
        padding && { padding: theme.spacing[padding] },
        paddingHorizontal && { paddingHorizontal: theme.spacing[paddingHorizontal] },
        paddingVertical && { paddingVertical: theme.spacing[paddingVertical] },
        radius && { borderRadius: theme.radii[radius] },
        style,
      ]}
      {...props}
    />
  );
}
