import { fireEvent, render } from '@testing-library/react-native';
import { Text } from 'react-native';

import { AppErrorBoundary } from '@/components/feedback/AppErrorBoundary';
import { ThemeProvider } from '@/design-system/theme';

let shouldFail = true;

function Initializer() {
  if (shouldFail) {
    throw new Error('test initialization failure');
  }
  return <Text>Local data remains available</Text>;
}

test('offers recovery without resetting local data after initialization fails', () => {
  shouldFail = true;
  const consoleError = jest.spyOn(console, 'error').mockImplementation(() => undefined);
  const view = render(
    <ThemeProvider preference="light">
      <AppErrorBoundary>
        <Initializer />
      </AppErrorBoundary>
    </ThemeProvider>,
  );

  expect(view.getByRole('alert')).toBeTruthy();
  expect(view.getByText('Try loading the app again.')).toBeTruthy();

  shouldFail = false;
  fireEvent.press(view.getByRole('button', { name: 'Try again' }));
  expect(view.getByText('Local data remains available')).toBeTruthy();
  consoleError.mockRestore();
});
