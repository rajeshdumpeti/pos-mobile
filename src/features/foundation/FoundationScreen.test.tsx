import { render } from '@testing-library/react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { ThemeProvider } from '@/design-system/theme';

import { FoundationScreen } from './FoundationScreen';

test('identifies the temporary foundation without demo product content', () => {
  const view = render(
    <SafeAreaProvider
      initialMetrics={{
        frame: { x: 0, y: 0, width: 390, height: 844 },
        insets: { top: 47, right: 0, bottom: 34, left: 0 },
      }}
    >
      <ThemeProvider preference="light">
        <FoundationScreen />
      </ThemeProvider>
    </SafeAreaProvider>,
  );

  expect(view.getByRole('header', { name: 'POS foundation' })).toBeTruthy();
  expect(view.getByTestId('foundation-screen')).toBeTruthy();
  expect(view.queryByText(/Rajesh|priorities|routine|water|metric|demo account/i)).toBeNull();
});
