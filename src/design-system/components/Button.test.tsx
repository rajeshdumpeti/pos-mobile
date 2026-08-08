import { fireEvent, render } from '@testing-library/react-native';

import { ThemeProvider } from '@/design-system/theme';

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
