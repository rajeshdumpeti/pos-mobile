import React, { useId, useState } from 'react';
import {
  TextInput as NativeTextInput,
  TextInputProps as NativeTextInputProps,
  View,
} from 'react-native';

import { useTheme } from '@/design-system/theme';
import { AppText } from './AppText';
import { Stack } from './Stack';

export type TextInputProps = NativeTextInputProps & {
  label: string;
  hint?: string;
  error?: string;
  disabled?: boolean;
};
export function TextInput({
  label,
  hint,
  error,
  disabled = false,
  accessibilityLabel,
  style,
  ...props
}: TextInputProps) {
  const theme = useTheme();
  const [focused, setFocused] = useState(false);
  const hintId = useId();
  const errorId = useId();
  return (
    <Stack gap="xxs">
      <AppText variant="label">{label}</AppText>
      <NativeTextInput
        {...props}
        accessibilityLabel={accessibilityLabel ?? label}
        accessibilityHint={error ?? hint}
        accessibilityState={{ disabled }}
        editable={!disabled}
        placeholderTextColor={theme.colors.textMuted}
        onFocus={(event) => {
          setFocused(true);
          props.onFocus?.(event);
        }}
        onBlur={(event) => {
          setFocused(false);
          props.onBlur?.(event);
        }}
        style={[
          theme.typography.body,
          {
            minHeight: theme.accessibility.minimumTouchTarget,
            paddingHorizontal: theme.spacing.md,
            paddingVertical: theme.spacing.sm,
            borderRadius: theme.radii.small,
            borderWidth: focused || error ? 2 : 1,
            borderColor: error
              ? theme.colors.danger
              : focused
                ? theme.colors.focusRing
                : theme.colors.borderDefault,
            backgroundColor: disabled
              ? theme.colors.backgroundSecondary
              : theme.colors.surfacePrimary,
            color: theme.colors.textPrimary,
            opacity: disabled ? theme.opacity.disabled : 1,
          },
          style,
        ]}
      />
      <View>
        {error ? (
          <AppText nativeID={errorId} accessibilityRole="alert" variant="caption" color="danger">
            Error: {error}
          </AppText>
        ) : hint ? (
          <AppText nativeID={hintId} variant="caption" color="muted">
            {hint}
          </AppText>
        ) : null}
      </View>
    </Stack>
  );
}
