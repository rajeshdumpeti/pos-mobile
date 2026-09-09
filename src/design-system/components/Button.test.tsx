import { fireEvent, render } from '@testing-library/react-native';
import { ActivityIndicator, StyleSheet } from 'react-native';

import { createTheme, ThemeProvider } from '@/design-system/theme';

import { Button } from './Button';

function renderButton(element: React.ReactElement) {
  return render(<ThemeProvider preference="light">{element}</ThemeProvider>);
}

test('provides button semantics and invokes its action', () => {
  const onPress = jest.fn();
  const view = renderButton(<Button label="Continue" onPress={onPress} />);
  const button = view.getByRole('button', { name: 'Continue' });
  fireEvent.press(button);
  expect(onPress).toHaveBeenCalledTimes(1);
  expect(button.props.accessibilityState.disabled).toBe(false);
});

test('disabled and loading buttons are unavailable and announce state', () => {
  const onPress = jest.fn();
  const disabled = renderButton(
    <Button label="Delete" variant="destructive" disabled onPress={onPress} />,
  );
  fireEvent.press(disabled.getByRole('button', { name: 'Delete' }));
  expect(onPress).not.toHaveBeenCalled();
  expect(disabled.getByRole('button').props.accessibilityState.disabled).toBe(true);

  const loading = renderButton(<Button label="Save" loading onPress={onPress} />);
  expect(loading.getByRole('button', { name: 'Save' }).props.accessibilityState.busy).toBe(true);
  expect(loading.getByRole('progressbar', { name: 'Save, loading' })).toBeTruthy();
});

test.each(['light', 'dark'] as const)(
  'uses semantic primary colors for normal, pressed, and loading states in %s',
  (mode) => {
    const colors = createTheme(mode).colors;
    const view = render(
      <ThemeProvider preference={mode}>
        <Button label="Continue" />
      </ThemeProvider>,
    );

    const button = view.getByRole('button');
    expect(StyleSheet.flatten(button.props.style)).toEqual(
      expect.objectContaining({
        backgroundColor: colors.accentPrimary,
        borderColor: colors.accentPrimary,
        opacity: 1,
      }),
    );
    expect(view.getByText('Continue')).toHaveStyle({ color: colors.onAccent });

    view.rerender(
      <ThemeProvider preference={mode}>
        <Button label="Continue" testOnly_pressed />
      </ThemeProvider>,
    );
    expect(button).toHaveStyle({ backgroundColor: colors.accentPressed, opacity: 1 });

    view.rerender(
      <ThemeProvider preference={mode}>
        <Button label="Continue" loading />
      </ThemeProvider>,
    );
    expect(view.UNSAFE_getByType(ActivityIndicator).props.color).toBe(colors.onAccent);
    expect(StyleSheet.flatten(view.getByRole('button').props.style)).toEqual(
      expect.objectContaining({
        backgroundColor: colors.accentPrimary,
        borderColor: colors.accentPrimary,
        opacity: 1,
      }),
    );
  },
);

test('uses semantic control sizing independent of the spacing scale', () => {
  const theme = createTheme('light');
  const view = renderButton(<Button label="Continue" onPress={jest.fn()} />);
  expect(StyleSheet.flatten(view.getByRole('button').props.style)).toEqual(
    expect.objectContaining({
      minHeight: theme.controlSizes.buttonHeight,
      minWidth: theme.controlSizes.minimumTouchTarget,
    }),
  );
  expect(theme.controlSizes.minimumTouchTarget).toBeGreaterThanOrEqual(44);
});

test.each(['light', 'dark'] as const)(
  'flattens deterministic disabled primary container and content colors in %s',
  (mode) => {
    const colors = createTheme(mode).colors;
    const view = render(
      <ThemeProvider preference={mode}>
        <Button label="Continue" disabled onPress={jest.fn()} />
      </ThemeProvider>,
    );
    const button = view.getByRole('button', { name: 'Continue' });
    expect(StyleSheet.flatten(button.props.style)).toEqual(
      expect.objectContaining({
        backgroundColor: colors.disabledSurface,
        borderColor: colors.disabledBorder,
        borderWidth: 1,
        opacity: 1,
      }),
    );
    expect(view.getByText('Continue')).toHaveStyle({ color: colors.disabledContent });
    expect(button.props.accessibilityState.disabled).toBe(true);
  },
);
