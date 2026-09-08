import React from 'react';
import { Pressable, PressableProps } from 'react-native';

import { useTheme } from '@/design-system/theme';
import { joinClassNames } from '@/design-system/nativewind';
import { AppText } from './AppText';
import { LoadingIndicator } from './LoadingIndicator';

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'destructive';
export type ButtonProps = Omit<PressableProps, 'children'> & {
  label: string;
  variant?: ButtonVariant;
  loading?: boolean;
};
export function Button({
  label,
  variant = 'primary',
  loading = false,
  disabled = false,
  className,
  style,
  ...props
}: ButtonProps) {
  const theme = useTheme();
  const unavailable = disabled || loading;
  const background = {
    primary: theme.colors.accentPrimary,
    secondary: theme.colors.accentSoft,
    ghost: 'transparent',
    destructive: theme.colors.danger,
  }[variant];
  const textColor =
    variant === 'primary' ? 'onAccent' : variant === 'destructive' ? 'inverse' : 'accent';
  return (
    <Pressable
      {...props}
      accessibilityRole="button"
      accessibilityLabel={props.accessibilityLabel ?? label}
      accessibilityState={{ disabled: unavailable, busy: loading }}
      className={joinClassNames('min-w-touch items-center justify-center', className)}
      disabled={unavailable}
      style={(state) => [
        {
          minHeight: theme.accessibility.minimumTouchTarget,
          borderRadius: theme.radii.small,
          paddingHorizontal: theme.spacing.lg,
          backgroundColor:
            state.pressed && variant === 'primary' ? theme.colors.accentPressed : background,
          opacity: unavailable
            ? theme.opacity.disabled
            : state.pressed && variant !== 'primary'
              ? theme.opacity.pressed
              : 1,
        },
        typeof style === 'function' ? style(state) : style,
      ]}
    >
      {loading ? (
        <LoadingIndicator
          label={`${label}, loading`}
          inverse={variant === 'destructive'}
          onAccent={variant === 'primary'}
        />
      ) : (
        <AppText variant="label" color={textColor}>
          {label}
        </AppText>
      )}
    </Pressable>
  );
}
