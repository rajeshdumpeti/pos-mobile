import { act, fireEvent, render, waitFor } from '@testing-library/react-native';
import { colorScheme } from 'nativewind';
import * as ReactNative from 'react-native';
import { ColorSchemeName, Pressable, Text } from 'react-native';

import type { AppearancePreferenceStorage } from './appearancePreferenceStorage';
import {
  createTheme,
  resolveThemeMode,
  ThemeProvider,
  useTheme,
  useThemePreference,
} from './ThemeProvider';

let mockSystemScheme: ColorSchemeName = 'light';

function createStorage(value: string | null = null): jest.Mocked<AppearancePreferenceStorage> {
  return {
    read: jest.fn().mockResolvedValue(value),
    write: jest.fn().mockResolvedValue(undefined),
  };
}

function ThemeConsumer() {
  const theme = useTheme();
  return (
    <Text testID="theme-state">
      {`${theme.preference}:${theme.resolvedAppearance}:${theme.isHydrated}:${theme.colors.accentPrimary}`}
    </Text>
  );
}

function ThemePreferenceControl() {
  const { setPreference } = useThemePreference();
  return (
    <Pressable accessibilityRole="button" onPress={() => void setPreference('dark')}>
      <Text>Use dark appearance</Text>
    </Pressable>
  );
}

beforeEach(() => {
  mockSystemScheme = 'light';
  jest.spyOn(ReactNative, 'useColorScheme').mockImplementation(() => mockSystemScheme);
});

afterEach(() => {
  jest.restoreAllMocks();
});

test('resolves explicit and system light/dark modes', () => {
  expect(resolveThemeMode('system', 'dark')).toBe('dark');
  expect(resolveThemeMode('system', 'light')).toBe('light');
  expect(resolveThemeMode('light', 'dark')).toBe('light');
  expect(resolveThemeMode('dark', 'light')).toBe('dark');
  expect(resolveThemeMode('system', null)).toBe('light');
  expect(resolveThemeMode('system', undefined)).toBe('light');
  expect(createTheme('dark').isDark).toBe(true);
  expect(Object.keys(createTheme('light').colors)).toEqual(Object.keys(createTheme('dark').colors));
});

test('does not render children until appearance restoration completes', async () => {
  let finishRead: ((value: string | null) => void) | undefined;
  const storage = createStorage();
  storage.read.mockImplementation(
    () =>
      new Promise((resolve) => {
        finishRead = resolve;
      }),
  );

  const view = render(
    <ThemeProvider storage={storage}>
      <ThemeConsumer />
    </ThemeProvider>,
  );

  expect(view.getByRole('progressbar', { name: 'Restoring appearance' })).toBeTruthy();
  expect(view.queryByTestId('theme-state')).toBeNull();

  await act(async () => finishRead?.(null));
  expect(
    view.getByText(`system:light:true:${createTheme('light').colors.accentPrimary}`),
  ).toBeTruthy();
  expect(storage.read).toHaveBeenCalledTimes(1);
  expect(storage.write).not.toHaveBeenCalled();
});

test.each(['system', 'light', 'dark'] as const)(
  'restores the valid stored %s preference',
  async (preference) => {
    const storage = createStorage(preference);
    const view = render(
      <ThemeProvider storage={storage}>
        <ThemeConsumer />
      </ThemeProvider>,
    );

    const expectedAppearance = preference === 'dark' ? 'dark' : 'light';
    expect(
      await view.findByText(
        `${preference}:${expectedAppearance}:true:${createTheme(expectedAppearance).colors.accentPrimary}`,
      ),
    ).toBeTruthy();
  },
);

test.each([null, '', 'purple', '{"preference":"dark"}'])(
  'defaults missing or malformed stored value %p to system',
  async (storedValue) => {
    const view = render(
      <ThemeProvider storage={createStorage(storedValue)}>
        <ThemeConsumer />
      </ThemeProvider>,
    );

    expect(
      await view.findByText(`system:light:true:${createTheme('light').colors.accentPrimary}`),
    ).toBeTruthy();
  },
);

test('stored light overrides a dark system appearance', async () => {
  mockSystemScheme = 'dark';
  const view = render(
    <ThemeProvider storage={createStorage('light')}>
      <ThemeConsumer />
    </ThemeProvider>,
  );

  expect(
    await view.findByText(`light:light:true:${createTheme('light').colors.accentPrimary}`),
  ).toBeTruthy();
});

test('stored dark overrides a light system appearance', async () => {
  const view = render(
    <ThemeProvider storage={createStorage('dark')}>
      <ThemeConsumer />
    </ThemeProvider>,
  );

  expect(
    await view.findByText(`dark:dark:true:${createTheme('dark').colors.accentPrimary}`),
  ).toBeTruthy();
});

test('system preference follows later device appearance changes', async () => {
  const storage = createStorage('system');
  const view = render(
    <ThemeProvider storage={storage}>
      <ThemeConsumer />
    </ThemeProvider>,
  );
  await view.findByText(`system:light:true:${createTheme('light').colors.accentPrimary}`);

  mockSystemScheme = 'dark';
  view.rerender(
    <ThemeProvider storage={storage}>
      <ThemeConsumer />
    </ThemeProvider>,
  );

  expect(
    view.getByText(`system:dark:true:${createTheme('dark').colors.accentPrimary}`),
  ).toBeTruthy();
  expect(storage.read).toHaveBeenCalledTimes(1);
});

test('an explicit preference ignores later device appearance changes', async () => {
  const storage = createStorage('light');
  const view = render(
    <ThemeProvider storage={storage}>
      <ThemeConsumer />
    </ThemeProvider>,
  );
  await view.findByText(`light:light:true:${createTheme('light').colors.accentPrimary}`);

  mockSystemScheme = 'dark';
  view.rerender(
    <ThemeProvider storage={storage}>
      <ThemeConsumer />
    </ThemeProvider>,
  );

  expect(
    view.getByText(`light:light:true:${createTheme('light').colors.accentPrimary}`),
  ).toBeTruthy();
});

test('updates semantic tokens and NativeWind immediately, then persists the preference', async () => {
  const storage = createStorage('system');
  const colorSchemeSpy = jest.spyOn(colorScheme, 'set');
  const view = render(
    <ThemeProvider storage={storage}>
      <ThemeConsumer />
      <ThemePreferenceControl />
    </ThemeProvider>,
  );
  await view.findByText(`system:light:true:${createTheme('light').colors.accentPrimary}`);

  fireEvent.press(view.getByRole('button', { name: 'Use dark appearance' }));

  expect(view.getByText(`dark:dark:true:${createTheme('dark').colors.accentPrimary}`)).toBeTruthy();
  await waitFor(() => expect(storage.write).toHaveBeenCalledWith('dark'));
  expect(colorSchemeSpy).toHaveBeenLastCalledWith('dark');
});

test('uses system safely when storage restoration fails', async () => {
  const storage = createStorage();
  storage.read.mockRejectedValue(new Error('storage unavailable'));
  const view = render(
    <ThemeProvider storage={storage}>
      <ThemeConsumer />
    </ThemeProvider>,
  );

  expect(
    await view.findByText(`system:light:true:${createTheme('light').colors.accentPrimary}`),
  ).toBeTruthy();
});

test('keeps the in-memory preference when persistence fails', async () => {
  const storage = createStorage('system');
  storage.write.mockRejectedValue(new Error('storage full'));
  const view = render(
    <ThemeProvider storage={storage}>
      <ThemeConsumer />
      <ThemePreferenceControl />
    </ThemeProvider>,
  );
  await view.findByText(`system:light:true:${createTheme('light').colors.accentPrimary}`);

  fireEvent.press(view.getByRole('button', { name: 'Use dark appearance' }));

  expect(view.getByText(`dark:dark:true:${createTheme('dark').colors.accentPrimary}`)).toBeTruthy();
  await waitFor(() => expect(storage.write).toHaveBeenCalledTimes(1));
});

test('supports a controlled preference without reading or writing storage', () => {
  const storage = createStorage('system');
  const view = render(
    <ThemeProvider preference="dark" storage={storage}>
      <ThemeConsumer />
    </ThemeProvider>,
  );

  expect(view.getByText(`dark:dark:true:${createTheme('dark').colors.accentPrimary}`)).toBeTruthy();
  expect(storage.read).not.toHaveBeenCalled();
  expect(storage.write).not.toHaveBeenCalled();
});

test('useTheme rejects use outside the provider', () => {
  expect(() => render(<ThemeConsumer />)).toThrow('useTheme must be used inside ThemeProvider');
});
