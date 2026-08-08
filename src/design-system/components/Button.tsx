import React from 'react';
import { Pressable, PressableProps, StyleSheet } from 'react-native';

import { useTheme } from '@/design-system/theme';
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
  const textColor = variant === 'primary' || variant === 'destructive' ? 'inverse' : 'primary';
  return (
    <Pressable
      {...props}
      accessibilityRole="button"
      accessibilityLabel={props.accessibilityLabel ?? label}
      accessibilityState={{ disabled: unavailable, busy: loading }}
      disabled={unavailable}
      style={(state) => [
        styles.button,
        {
          minHeight: theme.accessibility.minimumTouchTarget,
          borderRadius: theme.radii.small,
          paddingHorizontal: theme.spacing.lg,
          backgroundColor:
            state.pressed && variant === 'primary' ? theme.colors.accentPressed : background,
          opacity: unavailable ? theme.opacity.disabled : state.pressed ? theme.opacity.pressed : 1,
        },
        typeof style === 'function' ? style(state) : style,
      ]}
    >
      {loading ? (
        <LoadingIndicator
          label={`${label}, loading`}
          inverse={variant === 'primary' || variant === 'destructive'}
        />
      ) : (
        <AppText variant="label" color={textColor}>
          {label}
        </AppText>
      )}
    </Pressable>
  );
}
const styles = StyleSheet.create({
  button: { minWidth: 44, alignItems: 'center', justifyContent: 'center' },
});
