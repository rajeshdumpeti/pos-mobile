import AsyncStorage from '@react-native-async-storage/async-storage';

import { appearancePreferenceStorage } from './appearancePreferenceStorage';

jest.mock('@react-native-async-storage/async-storage', () => ({
  __esModule: true,
  default: {
    getItem: jest.fn(),
    setItem: jest.fn(),
  },
}));

const mockedAsyncStorage = jest.mocked(AsyncStorage);

beforeEach(() => {
  mockedAsyncStorage.getItem.mockReset();
  mockedAsyncStorage.setItem.mockReset();
});

test('reads the appearance preference from its private storage key', async () => {
  mockedAsyncStorage.getItem.mockResolvedValue('dark');

  await expect(appearancePreferenceStorage.read()).resolves.toBe('dark');
  expect(mockedAsyncStorage.getItem).toHaveBeenCalledWith('@pos/appearance-preference');
});

test('writes only a valid typed appearance preference to its private storage key', async () => {
  mockedAsyncStorage.setItem.mockResolvedValue(undefined);

  await appearancePreferenceStorage.write('light');
  expect(mockedAsyncStorage.setItem).toHaveBeenCalledWith('@pos/appearance-preference', 'light');
});
