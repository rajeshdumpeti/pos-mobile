import * as nativewind from 'nativewind';
import { render } from '@testing-library/react-native';

import { Stack } from '@/design-system/components';
import { joinClassNames } from '@/design-system/nativewind';
import { createTheme, ThemeProvider } from '@/design-system/theme';

import { createNativeWindThemeVariables } from './themeVariables';

type TailwindConfig = {
  content: string[];
  darkMode: string;
  theme: {
    extend: {
      colors: {
        surface: { primary: string };
        accent: { DEFAULT: string; pressed: string; soft: string; content: string };
        border: { focus: string };
      };
    };
  };
};

const tailwindConfig = jest.requireActual<TailwindConfig>('../../../tailwind.config.js');

test('maps semantic classes to ThemeProvider-owned variables', () => {
  expect(tailwindConfig.darkMode).toBe('class');
  expect(tailwindConfig.theme.extend.colors.surface.primary).toBe(
    'var(--pos-color-surface-primary)',
  );
  expect(tailwindConfig.content).toContain('./app/**/*.{js,jsx,ts,tsx}');
  expect(tailwindConfig.content).toContain('./src/**/*.{js,jsx,ts,tsx}');
});

test('composes caller classes with primitive-owned classes', () => {
  const view = render(
    <ThemeProvider preference="light">
      <Stack testID="stack" className="p-pos-md" />
    </ThemeProvider>,
  );

  expect(view.getByTestId('stack').props.className).toBe('shrink-0 p-pos-md');
  expect(joinClassNames(undefined, 'items-center', false, 'p-pos-sm')).toBe(
    'items-center p-pos-sm',
  );
});

test.each(['light', 'dark'] as const)(
  'adapts the %s semantic accent roles into NativeWind variables',
  (mode) => {
    const variablesSpy = jest.spyOn(nativewind, 'vars');
    const theme = createTheme(mode);

    createNativeWindThemeVariables(theme);

    expect(variablesSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        '--pos-color-accent-primary': theme.colors.accentPrimary,
        '--pos-color-accent-pressed': theme.colors.accentPressed,
        '--pos-color-accent-soft': theme.colors.accentSoft,
        '--pos-color-on-accent': theme.colors.onAccent,
        '--pos-color-focus-ring': theme.colors.focusRing,
      }),
    );
    expect(tailwindConfig.theme.extend.colors.accent).toEqual({
      DEFAULT: 'var(--pos-color-accent-primary)',
      pressed: 'var(--pos-color-accent-pressed)',
      soft: 'var(--pos-color-accent-soft)',
      content: 'var(--pos-color-on-accent)',
    });
    expect(tailwindConfig.theme.extend.colors.border.focus).toBe('var(--pos-color-focus-ring)');
    variablesSpy.mockRestore();
  },
);
