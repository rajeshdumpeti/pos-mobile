export type ThemePreference = 'system' | 'light' | 'dark';
export type ResolvedAppearance = 'light' | 'dark';

export const defaultThemePreference: ThemePreference = 'system';

export function isThemePreference(value: unknown): value is ThemePreference {
  return value === 'system' || value === 'light' || value === 'dark';
}

export function parseThemePreference(value: unknown): ThemePreference {
  return isThemePreference(value) ? value : defaultThemePreference;
}
