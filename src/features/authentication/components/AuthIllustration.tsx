import React from 'react';
import { View } from 'react-native';

import { POSIcon, POSIconName } from '@/design-system/icons';
import { useTheme } from '@/design-system/theme';

const illustrationIcons = {
  brand: 'leaf',
  email: 'email',
  security: 'shield',
  biometric: 'fingerprint',
  success: 'check',
} as const satisfies Record<string, POSIconName>;

export function AuthIllustration({
  kind,
  accessibilityLabel,
}: {
  kind: keyof typeof illustrationIcons;
  accessibilityLabel: string;
}) {
  const theme = useTheme();
  return (
    <View
      accessible
      accessibilityRole="image"
      accessibilityLabel={accessibilityLabel}
      className="self-center items-center justify-center"
      style={{
        width: 104,
        height: 104,
        borderRadius: theme.radii.pill,
        backgroundColor: theme.colors.accentSoft,
        borderColor: theme.colors.borderDefault,
        borderWidth: 1,
      }}
    >
      <View
        className="items-center justify-center"
        style={{
          width: 68,
          height: 68,
          borderRadius: theme.radii.large,
          backgroundColor: theme.colors.surfacePrimary,
          ...theme.shadows.card,
        }}
      >
        <POSIcon name={illustrationIcons[kind]} size={34} tone="accent" />
      </View>
    </View>
  );
}
