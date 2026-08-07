import { useQueryClient } from '@tanstack/react-query';
import { render, waitFor } from '@testing-library/react-native';
import { Text } from 'react-native';

import { AppProviders } from '@/providers/AppProviders';

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
  return <Text>{queryClient ? 'providers ready' : 'missing providers'}</Text>;
}

test('renders application children with the React Query provider', async () => {
  const fetchMock = jest.spyOn(global, 'fetch').mockRejectedValueOnce(new Error('offline'));

  const view = render(
    <AppProviders>
      <QueryConsumer />
    </AppProviders>,
  );

  expect(view.getByText('providers ready')).toBeTruthy();
  await waitFor(() => expect(fetchMock).toHaveBeenCalled());
  fetchMock.mockRestore();
});
