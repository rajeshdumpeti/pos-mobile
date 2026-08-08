import React from 'react';
import { StyleSheet } from 'react-native';

import { SpacingToken } from '@/design-system/tokens';
import { useTheme } from '@/design-system/theme';

import { Box, BoxProps } from './Box';

export type StackProps = BoxProps & {
  gap?: SpacingToken;
  direction?: 'vertical' | 'horizontal';
  align?: 'flex-start' | 'center' | 'flex-end' | 'stretch';
  justify?: 'flex-start' | 'center' | 'flex-end' | 'space-between';
};
export function Stack({
  gap = 'md',
  direction = 'vertical',
  align = 'stretch',
  justify = 'flex-start',
  style,
  ...props
}: StackProps) {
  const theme = useTheme();
  return (
    <Box
      style={[
        styles.base,
        {
          flexDirection: direction === 'vertical' ? 'column' : 'row',
          gap: theme.spacing[gap],
          alignItems: align,
          justifyContent: justify,
        },
        style,
      ]}
      {...props}
    />
  );
}
const styles = StyleSheet.create({ base: { flexShrink: 0 } });
