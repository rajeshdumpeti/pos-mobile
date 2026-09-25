import React, { useState } from 'react';
import { Pressable, PressableProps, StyleProp, StyleSheet, ViewStyle } from 'react-native';

import { useTheme } from '@/design-system/theme';
import { AppText } from './AppText';
import { resolveButtonVisualStyle } from './buttonVisualStyle';
import { LoadingIndicator } from './LoadingIndicator';

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'destructive';
export type ButtonProps = Omit<PressableProps, 'children' | 'className' | 'style'> & {
  label: string;
  variant?: ButtonVariant;
  loading?: boolean;
  style?: StyleProp<ViewStyle>;
};
export function Button({
  label,
  variant = 'primary',
  loading = false,
  disabled = false,
  style,
  onPressIn,
  onPressOut,
  testOnly_pressed = false,
  ...props
}: ButtonProps) {
  const theme = useTheme();
  const [pressed, setPressed] = useState(false);
  const unavailable = disabled || loading;
  const active = pressed || Boolean(testOnly_pressed);
  const visual = resolveButtonVisualStyle({
    theme,
    variant,
    pressed: active,
    disabled: Boolean(disabled),
    loading,
  });
  return (
    <Pressable
      {...props}
      accessibilityRole="button"
      accessibilityLabel={props.accessibilityLabel ?? label}
      accessibilityState={{ ...props.accessibilityState, disabled: unavailable, busy: loading }}
      disabled={unavailable}
      onPressIn={(event) => {
        setPressed(true);
        onPressIn?.(event);
      }}
      onPressOut={(event) => {
        setPressed(false);
        onPressOut?.(event);
      }}
      testOnly_pressed={testOnly_pressed}
      style={[
        styles.container,
        style,
        {
          minHeight: theme.controlSizes.buttonHeight,
          minWidth: theme.controlSizes.minimumTouchTarget,
          borderRadius: theme.radii.small,
          paddingHorizontal: theme.spacing.lg,
          borderWidth: 1,
          ...visual.container,
        },
      ]}
    >
      {loading ? (
        <LoadingIndicator
          label={`${label}, loading`}
          inverse={variant === 'destructive'}
          onAccent={variant === 'primary'}
        />
      ) : (
        <AppText variant="label" color={visual.contentColor}>
          {label}
        </AppText>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});
