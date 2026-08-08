import React, { createContext, useContext, useEffect, useMemo } from 'react';
import { ColorSchemeName, StyleSheet, useColorScheme, View } from 'react-native';

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
import {
  createNativeWindThemeVariables,
  syncNativeWindColorScheme,
} from '@/design-system/nativewind/themeVariables';

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
  const nativeWindVariables = useMemo(() => createNativeWindThemeVariables(theme), [theme]);

  useEffect(() => {
    syncNativeWindColorScheme(preference);
  }, [preference]);

  return (
    <ThemeContext.Provider value={theme}>
      <View style={[styles.root, nativeWindVariables]}>{children}</View>
    </ThemeContext.Provider>
  );
}

export function useTheme(): POSTheme {
  const theme = useContext(ThemeContext);
  if (!theme) throw new Error('useTheme must be used inside ThemeProvider');
  return theme;
}

const styles = StyleSheet.create({ root: { flex: 1 } });
