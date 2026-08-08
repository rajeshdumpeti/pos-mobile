import { render } from '@testing-library/react-native';

import { Stack } from '@/design-system/components';
import { joinClassNames } from '@/design-system/nativewind';
import { ThemeProvider } from '@/design-system/theme';

type TailwindConfig = {
  content: string[];
  darkMode: string;
  theme: {
    extend: {
      colors: {
        surface: { primary: string };
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
