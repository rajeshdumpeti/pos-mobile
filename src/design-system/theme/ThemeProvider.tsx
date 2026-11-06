import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, ColorSchemeName, StyleSheet, useColorScheme, View } from 'react-native';

import {
  accessibility,
  controlSizes,
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

import {
  defaultThemePreference,
  parseThemePreference,
  ResolvedAppearance,
  ThemePreference,
} from './appearancePreference';
import {
  appearancePreferenceStorage,
  AppearancePreferenceStorage,
} from './appearancePreferenceStorage';

export type POSTheme = POSThemeTokens & {
  mode: ResolvedAppearance;
  isDark: boolean;
};

export type ThemeContextValue = POSTheme & {
  preference: ThemePreference;
  resolvedAppearance: ResolvedAppearance;
  isHydrated: boolean;
  setPreference: (preference: ThemePreference) => Promise<void>;
};

export function resolveThemeMode(
  preference: ThemePreference,
  systemScheme: ColorSchemeName | null | undefined,
): ResolvedAppearance {
  if (preference !== 'system') return preference;
  return systemScheme === 'dark' ? 'dark' : 'light';
}

export function createTheme(mode: ResolvedAppearance): POSTheme {
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
    controlSizes,
  };
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

export function ThemeProvider({
  children,
  preference: controlledPreference,
  storage = appearancePreferenceStorage,
}: React.PropsWithChildren<{
  preference?: ThemePreference;
  storage?: AppearancePreferenceStorage;
}>) {
  const systemScheme = useColorScheme();
  const [storedPreference, setStoredPreference] = useState<ThemePreference>(defaultThemePreference);
  const [isHydrated, setIsHydrated] = useState(controlledPreference !== undefined);
  const preference = controlledPreference ?? storedPreference;
  const mode = resolveThemeMode(preference, systemScheme);
  const theme = useMemo(() => createTheme(mode), [mode]);
  const nativeWindVariables = useMemo(() => createNativeWindThemeVariables(theme), [theme]);

  useEffect(() => {
    if (controlledPreference !== undefined) {
      setIsHydrated(true);
      return;
    }

    let active = true;
    setIsHydrated(false);

    async function restorePreference() {
      try {
        const value = await storage.read();
        if (active) setStoredPreference(parseThemePreference(value));
      } catch {
        if (active) setStoredPreference(defaultThemePreference);
      } finally {
        if (active) setIsHydrated(true);
      }
    }

    void restorePreference();

    return () => {
      active = false;
    };
  }, [controlledPreference, storage]);

  useEffect(() => {
    syncNativeWindColorScheme(preference);
  }, [preference]);

  const setPreference = useCallback(
    async (nextPreference: ThemePreference) => {
      setStoredPreference(nextPreference);

      try {
        await storage.write(nextPreference);
      } catch {
        // The valid in-memory preference remains active for this session.
      }
    },
    [storage],
  );

  const context = useMemo<ThemeContextValue>(
    () => ({
      ...theme,
      preference,
      resolvedAppearance: mode,
      isHydrated,
      setPreference,
    }),
    [isHydrated, mode, preference, setPreference, theme],
  );

  return (
    <ThemeContext.Provider value={context}>
      <View
        style={[
          styles.root,
          { backgroundColor: theme.colors.backgroundPrimary },
          nativeWindVariables,
        ]}
      >
        {isHydrated ? (
          children
        ) : (
          <View
            accessible
            accessibilityRole="progressbar"
            accessibilityLabel="Restoring appearance"
            style={styles.restoring}
          >
            <ActivityIndicator color={theme.colors.accentPrimary} />
          </View>
        )}
      </View>
    </ThemeContext.Provider>
  );
}

export function useTheme(): ThemeContextValue {
  const theme = useContext(ThemeContext);
  if (!theme) throw new Error('useTheme must be used inside ThemeProvider');
  return theme;
}

export function useThemePreference() {
  const { preference, resolvedAppearance, isHydrated, setPreference } = useTheme();
  return { preference, resolvedAppearance, isHydrated, setPreference };
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  restoring: { flex: 1, alignItems: 'center', justifyContent: 'center' },
});
