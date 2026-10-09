import React, { useState } from 'react';
import { TextInput as NativeTextInput, View, StyleSheet, useWindowDimensions } from 'react-native';
import { AppText } from '@/design-system';
import { useTheme } from '@/design-system/theme';

export function CodeEntry({
  value,
  onChangeText,
  onBlur,
  error,
  ref,
}: {
  value?: string;
  onChangeText?: (value: string) => void;
  onBlur?: () => void;
  error?: string;
  ref?: React.Ref<NativeTextInput>;
}) {
  const theme = useTheme();
  const { fontScale } = useWindowDimensions();
  const [localCode, setLocalCode] = useState('');
  const code = value ?? localCode;
  const [focused, setFocused] = useState(false);
  return (
    <View style={{ gap: theme.spacing.sm }}>
      <AppText variant="label">Verification code</AppText>
      <View>
        <View
          pointerEvents="none"
          accessibilityElementsHidden
          importantForAccessibility="no-hide-descendants"
          style={{ flexDirection: 'row', gap: theme.spacing.xxs }}
        >
          {Array.from({ length: 6 }, (_, index) => (
            <View
              key={index}
              testID={`code-cell-${index}`}
              style={{
                flex: 1,
                minHeight: theme.controlSizes.inputHeight * Math.max(1, fontScale),
                alignItems: 'center',
                justifyContent: 'center',
                borderRadius: theme.radii.small,
                borderWidth: 2,
                borderColor:
                  focused && index === Math.min(code.length, 5)
                    ? theme.colors.focusRing
                    : theme.colors.borderDefault,
                backgroundColor: theme.colors.surfacePrimary,
              }}
            >
              <AppText variant="title" color="accent">
                {code[index] ?? '·'}
              </AppText>
            </View>
          ))}
        </View>
        <NativeTextInput
          ref={ref}
          accessibilityLabel="Six-digit verification code"
          accessibilityHint="Enter six digits. You can paste a code or delete digits."
          accessibilityValue={{ text: `${code.length} of 6 digits entered` }}
          value={code}
          aria-invalid={Boolean(error)}
          onChangeText={(nextValue) => {
            const digits = nextValue.replace(/[^0-9]/g, '').slice(0, 6);
            setLocalCode(digits);
            onChangeText?.(digits);
          }}
          keyboardType="number-pad"
          autoComplete="one-time-code"
          textContentType="oneTimeCode"
          autoCorrect={false}
          caretHidden
          onFocus={() => setFocused(true)}
          onBlur={() => {
            setFocused(false);
            onBlur?.();
          }}
          style={[
            StyleSheet.absoluteFill,
            {
              color: 'transparent',
              backgroundColor: 'transparent',
              fontSize: theme.typography.body.fontSize,
            },
          ]}
        />
      </View>
      {error ? (
        <AppText accessibilityRole="alert" variant="caption" color="danger">
          Error: {error}
        </AppText>
      ) : null}
    </View>
  );
}
