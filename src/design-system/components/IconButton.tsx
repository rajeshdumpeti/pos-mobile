import React from 'react';
import { Pressable, PressableProps } from 'react-native';

import { POSIcon, POSIconName } from '@/design-system/icons';
import { joinClassNames } from '@/design-system/nativewind';
import { useTheme } from '@/design-system/theme';

export type IconButtonProps = Omit<PressableProps, 'children'> & {
  icon: POSIconName;
  accessibilityLabel: string;
};
export function IconButton({
  icon,
  accessibilityLabel,
  disabled = false,
  className,
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
      className={joinClassNames('items-center justify-center', className)}
      disabled={isDisabled}
      hitSlop={4}
      style={(state) => [
        {
          width: theme.controlSizes.iconButton,
          height: theme.controlSizes.iconButton,
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
