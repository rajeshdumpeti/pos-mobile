import React, { createContext, useContext, useMemo } from 'react';
import { ColorSchemeName, useColorScheme } from 'react-native';

import {
  accessibility,
  darkColors,
  fontWeights,
  lightColors,
  motionDuration,
  opacity,
  POSThemeTokens,
  radii,
  shadows,
  spacing,
  typography,
} from '@/design-system/tokens';

export type ThemeMode = 'light' | 'dark';
export type ThemePreference = ThemeMode | 'system';
export type POSTheme = POSThemeTokens & { mode: ThemeMode; isDark: boolean };

export function resolveThemeMode(
  preference: ThemePreference,
  systemScheme: ColorSchemeName,
): ThemeMode {
  if (preference !== 'system') return preference;
  return systemScheme === 'dark' ? 'dark' : 'light';
}

export function createTheme(mode: ThemeMode): POSTheme {
  return {
    mode,
    isDark: mode === 'dark',
    colors: mode === 'dark' ? darkColors : lightColors,
    spacing,
    typography,
    fontWeights,
    radii,
    shadows,
    opacity,
    motionDuration,
    accessibility,
  };
}

const ThemeContext = createContext<POSTheme | null>(null);

export function ThemeProvider({
  children,
  preference = 'system',
}: React.PropsWithChildren<{ preference?: ThemePreference }>) {
  const systemScheme = useColorScheme();
  const mode = resolveThemeMode(preference, systemScheme);
  const theme = useMemo(() => createTheme(mode), [mode]);

  return <ThemeContext.Provider value={theme}>{children}</ThemeContext.Provider>;
}

export function useTheme(): POSTheme {
  const theme = useContext(ThemeContext);
  if (!theme) throw new Error('useTheme must be used inside ThemeProvider');
  return theme;
}
