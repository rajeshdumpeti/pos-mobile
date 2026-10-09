import React, { useState } from 'react';
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
  onPressIn,
  onPressOut,
  onHoverIn,
  onHoverOut,
  ...props
}: IconButtonProps) {
  const theme = useTheme();
  const [pressed, setPressed] = useState(false),
    [hovered, setHovered] = useState(false);
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
      onPressIn={(event) => {
        setPressed(true);
        onPressIn?.(event);
      }}
      onPressOut={(event) => {
        setPressed(false);
        onPressOut?.(event);
      }}
      onHoverIn={(event) => {
        setHovered(true);
        onHoverIn?.(event);
      }}
      onHoverOut={(event) => {
        setHovered(false);
        onHoverOut?.(event);
      }}
      style={[
        {
          width: theme.controlSizes.iconButton,
          height: theme.controlSizes.iconButton,
          borderRadius: theme.radii.pill,
          backgroundColor: pressed ? theme.colors.accentSoft : 'transparent',
          opacity: isDisabled ? theme.opacity.disabled : 1,
        },
        typeof style === 'function' ? style({ pressed, hovered }) : style,
      ]}
    >
      <POSIcon name={icon} tone="accent" />
    </Pressable>
  );
}
