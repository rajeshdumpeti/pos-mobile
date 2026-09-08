import { useQueryClient } from '@tanstack/react-query';
import { render } from '@testing-library/react-native';
import { Text } from 'react-native';

import { AppProviders } from '@/providers/AppProviders';
import { useTheme } from '@/design-system/theme';

jest.mock('react-native-gesture-handler', () => {
  const { View } = jest.requireActual<typeof import('react-native')>('react-native');
  return { GestureHandlerRootView: View };
});

jest.mock('react-native-safe-area-context', () => {
  const actual = jest.requireActual<typeof import('react-native-safe-area-context')>(
    'react-native-safe-area-context',
  );
  const { View } = jest.requireActual<typeof import('react-native')>('react-native');
  return { ...actual, SafeAreaProvider: View };
});

function QueryConsumer() {
  const queryClient = useQueryClient();
  const theme = useTheme();
  return <Text>{queryClient ? `providers ready:${theme.mode}` : 'missing providers'}</Text>;
}

test('renders application children with the React Query provider', () => {
  const view = render(
    <AppProviders themePreference="dark">
      <QueryConsumer />
    </AppProviders>,
  );

  expect(view.getByText('providers ready:dark')).toBeTruthy();
});
