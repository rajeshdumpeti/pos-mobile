import React from 'react';
import { Pressable, PressableProps, StyleSheet } from 'react-native';

import { POSIcon, POSIconName } from '@/design-system/icons';
import { useTheme } from '@/design-system/theme';

export type IconButtonProps = Omit<PressableProps, 'children'> & {
  icon: POSIconName;
  accessibilityLabel: string;
};
export function IconButton({
  icon,
  accessibilityLabel,
  disabled = false,
  style,
  ...props
}: IconButtonProps) {
  const theme = useTheme();
  const isDisabled = Boolean(disabled);
  return (
    <Pressable
      {...props}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      accessibilityState={{ disabled: isDisabled }}
      disabled={isDisabled}
      hitSlop={4}
      style={(state) => [
        styles.button,
        {
          width: theme.accessibility.minimumTouchTarget,
          height: theme.accessibility.minimumTouchTarget,
          borderRadius: theme.radii.pill,
          backgroundColor: state.pressed ? theme.colors.accentSoft : 'transparent',
          opacity: isDisabled ? theme.opacity.disabled : 1,
        },
        typeof style === 'function' ? style(state) : style,
      ]}
    >
      <POSIcon name={icon} tone="accent" />
    </Pressable>
  );
}
const styles = StyleSheet.create({ button: { alignItems: 'center', justifyContent: 'center' } });
