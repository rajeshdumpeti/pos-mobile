import { render } from '@testing-library/react-native';
import { Text } from 'react-native';

import { createTheme, resolveThemeMode, ThemeProvider, useTheme } from './ThemeProvider';

function ThemeConsumer() {
  const theme = useTheme();
  return <Text>{`${theme.mode}:${theme.colors.backgroundPrimary}`}</Text>;
}

test('resolves explicit and system light/dark modes', () => {
  expect(resolveThemeMode('system', 'dark')).toBe('dark');
  expect(resolveThemeMode('system', 'light')).toBe('light');
  expect(resolveThemeMode('light', 'dark')).toBe('light');
  expect(createTheme('dark').isDark).toBe(true);
});

test('useTheme returns the provider-owned theme', () => {
  const view = render(
    <ThemeProvider preference="dark">
      <ThemeConsumer />
    </ThemeProvider>,
  );
  expect(view.getByText(/^dark:/)).toBeTruthy();
});

test('useTheme rejects use outside the provider', () => {
  expect(() => render(<ThemeConsumer />)).toThrow('useTheme must be used inside ThemeProvider');
});
