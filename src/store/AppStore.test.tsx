import { act, render } from '@testing-library/react-native';
import { Text } from 'react-native';

import { AppProvider } from './AppStore';

test('aborts the initialization request when the provider unmounts', async () => {
  let rejectRequest: ((reason: Error) => void) | undefined;
  let requestSignal: AbortSignal | undefined;
  const fetchMock = jest.spyOn(global, 'fetch').mockImplementation((_input, init) => {
    requestSignal = init?.signal ?? undefined;
    return new Promise((_resolve, reject) => {
      rejectRequest = reject;
    });
  });

  const view = render(
    <AppProvider>
      <Text>Prototype ready</Text>
    </AppProvider>,
  );

  expect(fetchMock).toHaveBeenCalledWith(
    expect.stringContaining('/dashboard'),
    expect.objectContaining({ signal: expect.any(AbortSignal) }),
  );
  expect(requestSignal?.aborted).toBe(false);

  view.unmount();
  expect(requestSignal?.aborted).toBe(true);

  await act(async () => {
    rejectRequest?.(new Error('request aborted'));
    await Promise.resolve();
  });
  fetchMock.mockRestore();
});
