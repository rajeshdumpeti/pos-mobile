import { fireEvent, render } from '@testing-library/react-native';
import { Text } from 'react-native';

import { AppErrorBoundary } from '@/components/feedback/AppErrorBoundary';

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
    <AppErrorBoundary>
      <Initializer />
    </AppErrorBoundary>,
  );

  expect(view.getByRole('alert')).toBeTruthy();
  expect(view.getByText('Your local data was not reset. Try loading the app again.')).toBeTruthy();

  shouldFail = false;
  fireEvent.press(view.getByRole('button', { name: 'Try again' }));
  expect(view.getByText('Local data remains available')).toBeTruthy();
  consoleError.mockRestore();
});
