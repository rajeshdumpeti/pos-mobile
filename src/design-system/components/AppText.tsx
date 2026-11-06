import React from 'react';
import { Text, TextProps } from 'react-native';

import { TypographyToken } from '@/design-system/tokens';
import { useTheme } from '@/design-system/theme';

export type AppTextProps = TextProps & {
  variant?: TypographyToken;
  color?:
    'primary' | 'secondary' | 'muted' | 'inverse' | 'danger' | 'accent' | 'onAccent' | 'disabled';
};

export function AppText({
  variant = 'body',
  color = 'primary',
  className,
  style,
  ...props
}: AppTextProps) {
  const theme = useTheme();
  const colors = {
    primary: theme.colors.textPrimary,
    secondary: theme.colors.textSecondary,
    muted: theme.colors.textMuted,
    inverse: theme.colors.textInverse,
    danger: theme.colors.danger,
    accent: theme.colors.accentPrimary,
    onAccent: theme.colors.onAccent,
    disabled: theme.colors.disabledContent,
  };
  return (
    <Text
      allowFontScaling
      className={className}
      style={[theme.typography[variant], { color: colors[color] }, style]}
      {...props}
    />
  );
}
