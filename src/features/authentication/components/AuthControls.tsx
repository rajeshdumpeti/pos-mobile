import React from 'react';
import { Pressable } from 'react-native';

import { AppText, Stack } from '@/design-system/components';
import { POSIcon, POSIconName } from '@/design-system/icons';
import { useTheme } from '@/design-system/theme';

export function AuthTextButton({
  label,
  onPress,
  accessibilityHint,
  disabled = false,
}: {
  label: string;
  onPress: () => void;
  accessibilityHint?: string;
  disabled?: boolean;
}) {
  const theme = useTheme();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityHint={accessibilityHint}
      accessibilityState={{ disabled }}
      disabled={disabled}
      hitSlop={6}
      onPress={onPress}
      style={({ pressed }) => ({
        minHeight: theme.accessibility.minimumTouchTarget,
        justifyContent: 'center',
        opacity: disabled ? theme.opacity.disabled : pressed ? theme.opacity.pressed : 1,
      })}
    >
      <AppText variant="label" style={{ color: theme.colors.accentPrimary }}>
        {label}
      </AppText>
    </Pressable>
  );
}

export function AuthSocialButton({
  label,
  icon,
  onPress,
  disabled = false,
}: {
  label: string;
  icon: Extract<POSIconName, 'apple' | 'google' | 'email'>;
  onPress: () => void;
  disabled?: boolean;
}) {
  const theme = useTheme();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled }}
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => ({
        minHeight: theme.accessibility.minimumTouchTarget,
        borderRadius: theme.radii.small,
        borderWidth: 1,
        borderColor: theme.colors.borderDefault,
        backgroundColor: theme.colors.surfacePrimary,
        opacity: disabled ? theme.opacity.disabled : pressed ? theme.opacity.pressed : 1,
        justifyContent: 'center',
        paddingHorizontal: theme.spacing.lg,
      })}
    >
      <Stack direction="horizontal" gap="sm" align="center" justify="center">
        <POSIcon name={icon} size={20} />
        <AppText variant="label" style={{ flexShrink: 1, textAlign: 'center' }}>
          {label}
        </AppText>
      </Stack>
    </Pressable>
  );
}

export function AuthCheckbox({
  checked,
  label,
  onPress,
  disabled = false,
}: {
  checked: boolean;
  label: string;
  onPress: () => void;
  disabled?: boolean;
}) {
  const theme = useTheme();
  return (
    <Pressable
      accessibilityRole="checkbox"
      accessibilityLabel={label}
      accessibilityState={{ checked, disabled }}
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => ({
        minHeight: theme.accessibility.minimumTouchTarget,
        justifyContent: 'center',
        opacity: disabled ? theme.opacity.disabled : pressed ? theme.opacity.pressed : 1,
      })}
    >
      <Stack direction="horizontal" gap="xs" align="center">
        <PressableVisual checked={checked} />
        <AppText style={{ flexShrink: 1 }}>{label}</AppText>
      </Stack>
    </Pressable>
  );
}

export function AuthRadioOption({
  selected,
  label,
  onPress,
}: {
  selected: boolean;
  label: string;
  onPress: () => void;
}) {
  const theme = useTheme();
  return (
    <Pressable
      accessibilityRole="radio"
      accessibilityLabel={label}
      accessibilityState={{ checked: selected }}
      onPress={onPress}
      style={({ pressed }) => ({
        minHeight: theme.accessibility.minimumTouchTarget,
        justifyContent: 'center',
        opacity: pressed ? theme.opacity.pressed : 1,
      })}
    >
      <Stack direction="horizontal" gap="xs" align="center">
        <Stack
          align="center"
          justify="center"
          style={{
            width: 24,
            height: 24,
            borderRadius: theme.radii.pill,
            borderWidth: 2,
            borderColor: selected ? theme.colors.accentPrimary : theme.colors.borderDefault,
          }}
        >
          {selected ? (
            <Stack
              style={{
                width: 12,
                height: 12,
                borderRadius: theme.radii.pill,
                backgroundColor: theme.colors.accentPrimary,
              }}
            />
          ) : null}
        </Stack>
        <AppText style={{ flexShrink: 1 }}>{label}</AppText>
      </Stack>
    </Pressable>
  );
}

function PressableVisual({ checked }: { checked: boolean }) {
  const theme = useTheme();
  return (
    <Stack
      align="center"
      justify="center"
      style={{
        width: 24,
        height: 24,
        borderRadius: theme.radii.small / 2,
        borderWidth: 1,
        borderColor: checked ? theme.colors.accentPrimary : theme.colors.borderDefault,
        backgroundColor: checked ? theme.colors.accentPrimary : theme.colors.surfacePrimary,
      }}
    >
      {checked ? <POSIcon name="check" size={16} color={theme.colors.textInverse} /> : null}
    </Stack>
  );
}
