import type { ViewStyle } from 'react-native';

import type { POSTheme } from '@/design-system/theme';

import type { ButtonVariant } from './Button';

export type ButtonContentColor = 'onAccent' | 'accent' | 'inverse' | 'disabled';

export function resolveButtonVisualStyle({
  theme,
  variant,
  pressed,
  disabled,
  loading,
}: {
  theme: POSTheme;
  variant: ButtonVariant;
  pressed: boolean;
  disabled: boolean;
  loading: boolean;
}): { container: ViewStyle; contentColor: ButtonContentColor } {
  if (disabled) {
    return {
      container: {
        backgroundColor: theme.colors.disabledSurface,
        borderColor: theme.colors.disabledBorder,
        opacity: 1,
      },
      contentColor: 'disabled',
    };
  }

  if (variant === 'primary') {
    const color = pressed && !loading ? theme.colors.accentPressed : theme.colors.accentPrimary;
    return {
      container: { backgroundColor: color, borderColor: color, opacity: 1 },
      contentColor: 'onAccent',
    };
  }

  if (variant === 'ghost') {
    return {
      container: {
        backgroundColor: pressed && !loading ? theme.colors.accentSoft : 'transparent',
        borderColor: 'transparent',
        opacity: 1,
      },
      contentColor: 'accent',
    };
  }

  const backgroundColor = variant === 'destructive' ? theme.colors.danger : theme.colors.accentSoft;
  return {
    container: {
      backgroundColor,
      borderColor: backgroundColor,
      opacity: pressed && !loading ? theme.opacity.pressed : 1,
    },
    contentColor: variant === 'destructive' ? 'inverse' : 'accent',
  };
}
