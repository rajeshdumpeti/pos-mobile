import { TextStyle, useColorScheme, ViewStyle } from 'react-native';

export const primitive = {
  sage700: '#315F4A', sage800: '#244B3A', sage200: '#C9DDD2', sage100: '#E8F0EB',
  stone25: '#FAFAF8', stone50: '#F6F5F1', stone100: '#EFEEE9', stone200: '#DFE1DC',
  stone500: '#68736D', stone700: '#3C4842', stone950: '#16211C', white: '#FFFFFF',
  amber700: '#8A5A20', amber100: '#F6EBDD', red700: '#9B4038', red100: '#F8E8E6',
  blue700: '#356277', blue100: '#E5F0F4', green700: '#2E6B4D', green100: '#E4F1E9',
} as const;

export const lightColors = {
  background: { primary: primitive.stone50, secondary: primitive.stone100 },
  surface: { primary: primitive.white, elevated: primitive.stone25 },
  text: { primary: primitive.stone950, secondary: primitive.stone700, muted: primitive.stone500, inverse: primitive.white },
  action: { primary: primitive.sage700, primaryPressed: primitive.sage800, secondary: primitive.sage100 },
  state: { success: primitive.green700, successSurface: primitive.green100, warning: primitive.amber700, warningSurface: primitive.amber100, error: primitive.red700, errorSurface: primitive.red100, info: primitive.blue700, infoSurface: primitive.blue100 },
  border: { default: primitive.stone200 }, progress: { track: primitive.sage100, fill: primitive.sage700 },
} as const;

export const darkColors = {
  background: { primary: '#101713', secondary: '#17201B' },
  surface: { primary: '#1C2721', elevated: '#233129' },
  text: { primary: '#F4F7F5', secondary: '#CDD7D1', muted: '#98A79F', inverse: primitive.stone950 },
  action: { primary: '#8AB9A1', primaryPressed: '#A5CBB7', secondary: '#263C31' },
  state: { success: '#91C9A8', successSurface: '#1D3829', warning: '#E4B874', warningSurface: '#3A2C18', error: '#EE9D96', errorSurface: '#432421', info: '#9FC9D9', infoSurface: '#203740' },
  border: { default: '#34423A' }, progress: { track: '#263C31', fill: '#8AB9A1' },
} as const;

export type ThemeColors = typeof lightColors;
export const spacing = { xxs: 4, xs: 8, sm: 12, md: 16, lg: 20, xl: 24, xxl: 32, xxxl: 40, huge: 48 } as const;
export const radius = { small: 10, medium: 16, large: 24, pill: 999 } as const;
export const elevation = { card: { shadowColor: '#000000', shadowOpacity: 0.04, shadowRadius: 8, shadowOffset: { width: 0, height: 3 }, elevation: 1 } satisfies ViewStyle };
export const typography = {
  display: { fontSize: 40, lineHeight: 46, fontWeight: '700', letterSpacing: -1.2 } satisfies TextStyle,
  screenTitle: { fontSize: 32, lineHeight: 38, fontWeight: '700', letterSpacing: -0.8 } satisfies TextStyle,
  sectionTitle: { fontSize: 18, lineHeight: 24, fontWeight: '700' } satisfies TextStyle,
  cardTitle: { fontSize: 16, lineHeight: 22, fontWeight: '700' } satisfies TextStyle,
  metricLarge: { fontSize: 32, lineHeight: 38, fontWeight: '700', fontVariant: ['tabular-nums'] } satisfies TextStyle,
  metricMedium: { fontSize: 24, lineHeight: 30, fontWeight: '700', fontVariant: ['tabular-nums'] } satisfies TextStyle,
  body: { fontSize: 16, lineHeight: 24, fontWeight: '400' } satisfies TextStyle,
  secondary: { fontSize: 14, lineHeight: 20, fontWeight: '400' } satisfies TextStyle,
  caption: { fontSize: 12, lineHeight: 17, fontWeight: '600' } satisfies TextStyle,
  buttonLabel: { fontSize: 15, lineHeight: 20, fontWeight: '700' } satisfies TextStyle,
  tabLabel: { fontSize: 11, lineHeight: 14, fontWeight: '600' } satisfies TextStyle,
} as const;

export function usePOSTheme() {
  const isDark = useColorScheme() === 'dark';
  return { colors: isDark ? darkColors : lightColors, isDark, spacing, radius, typography, elevation };
}

// Compatibility exports for the launch flow while it migrates to semantic tokens.
export const palette = { canvas: primitive.stone50, paper: primitive.white, ink: primitive.stone950, muted: primitive.stone500, line: primitive.stone200, sage: primitive.sage700, sageSoft: primitive.sage100, amber: primitive.amber700, danger: primitive.red700 };
export const space = { xs: spacing.xs, sm: spacing.sm, md: spacing.md, lg: spacing.xl, xl: spacing.xxl };
