import { render } from '@testing-library/react-native';

import { createTheme, ThemeProvider } from '@/design-system/theme';

import { IllustrationFrame, illustrationRegistry, resolveIllustration } from './index';
import type { IllustrationRole } from './types';

test.each<IllustrationRole>([
  'welcome',
  'emailVerification',
  'passwordReset',
  'success',
  'offline',
  'securityState',
])('resolves the registered artwork for %s', (role) => {
  expect(resolveIllustration(role)).toBe(illustrationRegistry[role]);
  expect(typeof resolveIllustration(role).Artwork).toBe('function');
});

test.each([undefined, null, '', 'unknown', 'toString', '__proto__'])(
  'safely resolves missing or unknown role %s',
  (role) => {
    expect(resolveIllustration(role)).toBe(resolveIllustration());
  },
);

test.each(['light', 'dark'] as const)(
  'renders a labeled image on the %s semantic surface',
  (mode) => {
    const view = render(
      <ThemeProvider preference={mode}>
        <IllustrationFrame role="welcome" accessibilityLabel="Welcome to POS" />
      </ThemeProvider>,
    );

    expect(view.getByRole('image', { name: 'Welcome to POS' })).toHaveStyle({
      backgroundColor: createTheme(mode).colors.accentSoft,
    });
  },
);

test('renders a missing role safely and hides decorative artwork from accessibility', () => {
  const view = render(
    <ThemeProvider preference="light">
      <IllustrationFrame decorative testID="illustration" size={NaN} />
    </ThemeProvider>,
  );

  expect(view.queryByRole('image')).toBeNull();
  expect(
    view.getByTestId('illustration', { includeHiddenElements: true }).props
      .importantForAccessibility,
  ).toBe('no-hide-descendants');
});
