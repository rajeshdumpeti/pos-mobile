import { fireEvent, render } from '@testing-library/react-native';

import { ThemeProvider } from '@/design-system/theme';

import { TextInput } from './TextInput';

test('connects a visible label, hint, and accessible input name', () => {
  const view = render(
    <ThemeProvider preference="light">
      <TextInput label="Amount" hint="Enter dollars and cents" />
    </ThemeProvider>,
  );
  expect(view.getByText('Amount')).toBeTruthy();
  expect(view.getByText('Enter dollars and cents')).toBeTruthy();
  expect(view.getByLabelText('Amount')).toBeTruthy();
  expect(view.getByLabelText('Amount').props.showSoftInputOnFocus).toBe(true);
});

test('allows an explicit non-keyboard text control', () => {
  const view = render(
    <ThemeProvider preference="light">
      <TextInput label="Amount" showSoftInputOnFocus={false} />
    </ThemeProvider>,
  );
  expect(view.getByLabelText('Amount').props.showSoftInputOnFocus).toBe(false);
});

test('announces error text and shows focus/error borders', () => {
  const view = render(
    <ThemeProvider preference="light">
      <TextInput label="Amount" error="Enter a valid amount" testID="amount" />
    </ThemeProvider>,
  );
  const input = view.getByTestId('amount');
  fireEvent(input, 'focus', { nativeEvent: {} });
  expect(view.getByRole('alert', { name: 'Error: Enter a valid amount' })).toBeTruthy();
  expect(input.props.accessibilityHint).toBe('Enter a valid amount');
});
