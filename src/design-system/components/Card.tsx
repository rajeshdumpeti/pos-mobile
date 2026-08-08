import React from 'react';
import { StyleSheet, ViewProps } from 'react-native';

import { useTheme } from '@/design-system/theme';

import { Box } from './Box';
export type CardProps = ViewProps & { variant?: 'standard' | 'elevated' };
export function Card({ variant = 'standard', className, style, ...props }: CardProps) {
  const theme = useTheme();
  return (
    <Box
      className={className}
      surface={variant === 'elevated' ? 'elevated' : 'surface'}
      padding="md"
      radius="medium"
      style={[
        styles.card,
        { borderColor: theme.colors.borderDefault },
        theme.shadows[variant === 'elevated' ? 'elevated' : 'card'],
        style,
      ]}
      {...props}
    />
  );
}
const styles = StyleSheet.create({ card: { borderWidth: StyleSheet.hairlineWidth } });
