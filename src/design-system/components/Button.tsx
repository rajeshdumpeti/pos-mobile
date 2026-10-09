import React, { useState } from 'react';
import { Pressable, PressableProps, StyleProp, StyleSheet, ViewStyle } from 'react-native';

import { useTheme } from '@/design-system/theme';
import { AppText } from './AppText';
import { resolveButtonVisualStyle } from './buttonVisualStyle';
import { LoadingIndicator } from './LoadingIndicator';
import { POSIcon, type POSIconName } from '../icons/POSIcon';
import { View } from 'react-native';

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'destructive';
export type ButtonProps = Omit<PressableProps, 'children' | 'className' | 'style'> & {
  label: string;
  leadingIcon?: POSIconName;
  radius?: 'small' | 'medium';
  variant?: ButtonVariant;
  loading?: boolean;
  style?: StyleProp<ViewStyle>;
};
export const Button = React.forwardRef<React.ElementRef<typeof Pressable>, ButtonProps>(
  function Button(
    {
      label,
      leadingIcon,
      radius = 'small',
      variant = 'primary',
      loading = false,
      disabled = false,
      style,
      onPressIn,
      onPressOut,
      testOnly_pressed = false,
      ...props
    }: ButtonProps,
    ref,
  ) {
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
        ref={ref}
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
            borderRadius: theme.radii[radius],
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
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'center',
              gap: theme.spacing.xs,
            }}
          >
            {leadingIcon && (
              <POSIcon
                name={leadingIcon}
                color={
                  {
                    onAccent: theme.colors.onAccent,
                    accent: theme.colors.accentPrimary,
                    inverse: theme.colors.textInverse,
                    disabled: theme.colors.disabledContent,
                  }[visual.contentColor]
                }
              />
            )}
            <AppText
              variant="label"
              color={visual.contentColor}
              style={{ flexShrink: 1, textAlign: 'center' }}
            >
              {label}
            </AppText>
          </View>
        )}
      </Pressable>
    );
  },
);

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});
