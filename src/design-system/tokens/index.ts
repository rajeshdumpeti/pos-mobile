import type { TextStyle, ViewStyle } from 'react-native';

const palette = {
  white: '#FFFFFF',
  ink: '#16211C',
  stone25: '#FAFAF8',
  stone50: '#F6F5F1',
  stone100: '#EFEEE9',
  stone200: '#DFE1DC',
  stone500: '#68736D',
  stone700: '#3C4842',
  violet100: '#F0EAFE',
  violet300: '#C4ADFA',
  violet700: '#6941C6',
  violet800: '#5331A3',
  violet950: '#302344',
  green100: '#E4F1E9',
  green700: '#2E6B4D',
  amber100: '#F6EBDD',
  amber700: '#8A5A20',
  red100: '#F8E8E6',
  red700: '#9B4038',
  blue100: '#E5F0F4',
  blue700: '#356277',
} as const;

export type SemanticColorTokens = {
  backgroundPrimary: string;
  backgroundSecondary: string;
  surfacePrimary: string;
  surfaceElevated: string;
  surfaceGlass: string;
  accentPrimary: string;
  accentPressed: string;
  accentSoft: string;
  onAccent: string;
  textPrimary: string;
  textSecondary: string;
  textMuted: string;
  textInverse: string;
  borderDefault: string;
  divider: string;
  focusRing: string;
  success: string;
  successSoft: string;
  warning: string;
  warningSoft: string;
  danger: string;
  dangerSoft: string;
  info: string;
  infoSoft: string;
  disabledSurface: string;
  disabledContent: string;
  disabledBorder: string;
};

export const lightColors: SemanticColorTokens = {
  backgroundPrimary: palette.stone50,
  backgroundSecondary: palette.stone100,
  surfacePrimary: palette.white,
  surfaceElevated: palette.stone25,
  surfaceGlass: 'rgba(255, 255, 255, 0.86)',
  accentPrimary: palette.violet700,
  accentPressed: palette.violet800,
  accentSoft: palette.violet100,
  onAccent: palette.white,
  textPrimary: palette.ink,
  textSecondary: palette.stone700,
  textMuted: palette.stone500,
  textInverse: palette.white,
  borderDefault: palette.stone200,
  divider: '#E8E9E5',
  focusRing: palette.violet700,
  success: palette.green700,
  successSoft: palette.green100,
  warning: palette.amber700,
  warningSoft: palette.amber100,
  danger: palette.red700,
  dangerSoft: palette.red100,
  info: palette.blue700,
  infoSoft: palette.blue100,
  disabledSurface: palette.stone100,
  disabledContent: palette.stone700,
  disabledBorder: palette.stone200,
};

export const darkColors: SemanticColorTokens = {
  backgroundPrimary: '#101713',
  backgroundSecondary: '#17201B',
  surfacePrimary: '#1C2721',
  surfaceElevated: '#233129',
  surfaceGlass: 'rgba(28, 39, 33, 0.88)',
  accentPrimary: palette.violet300,
  accentPressed: palette.violet100,
  accentSoft: palette.violet950,
  onAccent: palette.ink,
  textPrimary: '#F4F7F5',
  textSecondary: '#CDD7D1',
  textMuted: '#98A79F',
  textInverse: palette.ink,
  borderDefault: '#34423A',
  divider: '#2B3931',
  focusRing: palette.violet300,
  success: '#91C9A8',
  successSoft: '#1D3829',
  warning: '#E4B874',
  warningSoft: '#3A2C18',
  danger: '#EE9D96',
  dangerSoft: '#432421',
  info: '#9FC9D9',
  infoSoft: '#203740',
  disabledSurface: '#2B3931',
  disabledContent: '#98A79F',
  disabledBorder: '#46564C',
};

export const spacing = {
  none: 0,
  xxs: 4,
  xs: 8,
  sm: 12,
  md: 16,
  lg: 20,
  xl: 24,
  xxl: 32,
  xxxl: 40,
  huge: 48,
} as const;
export type SpacingToken = keyof typeof spacing;

export const fontWeights = {
  regular: '400',
  medium: '500',
  semibold: '600',
  bold: '700',
} as const satisfies Record<string, NonNullable<TextStyle['fontWeight']>>;

export const typography = {
  display: { fontSize: 40, lineHeight: 46, letterSpacing: -1.2, fontWeight: fontWeights.bold },
  heading: { fontSize: 32, lineHeight: 38, letterSpacing: -0.8, fontWeight: fontWeights.bold },
  title: { fontSize: 20, lineHeight: 27, fontWeight: fontWeights.bold },
  body: { fontSize: 16, lineHeight: 24, fontWeight: fontWeights.regular },
  label: { fontSize: 15, lineHeight: 20, fontWeight: fontWeights.semibold },
  caption: { fontSize: 12, lineHeight: 17, fontWeight: fontWeights.medium },
} as const satisfies Record<string, TextStyle>;
export type TypographyToken = keyof typeof typography;

export const radii = { none: 0, small: 10, medium: 16, large: 24, pill: 999 } as const;
export type RadiusToken = keyof typeof radii;
export const shadows = {
  none: {} satisfies ViewStyle,
  card: {
    shadowColor: '#000000',
    shadowOpacity: 0.04,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
    elevation: 1,
  } satisfies ViewStyle,
  elevated: {
    shadowColor: '#000000',
    shadowOpacity: 0.08,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 8 },
    elevation: 3,
  } satisfies ViewStyle,
} as const;
export const opacity = { disabled: 0.46, pressed: 0.72, muted: 0.64 } as const;
export const motionDuration = { instant: 0, fast: 120, standard: 200, deliberate: 320 } as const;
export const accessibility = { minimumTouchTarget: 44 } as const;
export const controlSizes = {
  minimumTouchTarget: 44,
  buttonHeight: 52,
  inputHeight: 48,
  iconButton: 44,
} as const;

export type POSThemeTokens = {
  colors: SemanticColorTokens;
  spacing: typeof spacing;
  typography: typeof typography;
  fontWeights: typeof fontWeights;
  radii: typeof radii;
  shadows: typeof shadows;
  opacity: typeof opacity;
  motionDuration: typeof motionDuration;
  accessibility: typeof accessibility;
  controlSizes: typeof controlSizes;
};
