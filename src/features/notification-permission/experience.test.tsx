import { act, fireEvent, render, renderHook, waitFor } from '@testing-library/react-native';
import { AppState } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { ThemeProvider } from '@/design-system/theme';
import type { PermissionAdapter, PermissionState } from './controller';
import { NotificationPermissionView } from './NotificationPermissionView';
import { NotificationPermissionScreen } from './NotificationPermissionScreen';
import { usePermission } from './usePermission';
const mockBack = jest.fn();
const mockAdapter = { check: jest.fn(), request: jest.fn(), openSettings: jest.fn() };
jest.mock('./platform', () => ({
  notificationPermissionAdapter: {
    check: () => mockAdapter.check(),
    request: () => mockAdapter.request(),
    openSettings: () => mockAdapter.openSettings(),
  },
}));
jest.mock('@/navigation', () => ({
  routes: { app: { index: '/(app)/(tabs)' } },
  useSafeNavigation: () => ({ backOrReplace: mockBack }),
}));
const initial: PermissionState = {
  phase: 'ready',
  permission: { authorization: 'notDetermined', canAskAgain: true },
};
const wrap = (children: React.ReactNode, mode: 'light' | 'dark' = 'light') => (
  <SafeAreaProvider
    initialMetrics={{
      frame: { x: 0, y: 0, width: 320, height: 640 },
      insets: { top: 44, bottom: 34, left: 0, right: 0 },
    }}
  >
    <ThemeProvider preference={mode}>{children}</ThemeProvider>
  </SafeAreaProvider>
);
beforeEach(() => {
  jest.clearAllMocks();
  mockAdapter.check.mockResolvedValue(initial.permission);
  mockAdapter.request.mockResolvedValue({ authorization: 'authorized', canAskAgain: false });
  mockAdapter.openSettings.mockResolvedValue(undefined);
});
test.each(['light', 'dark'] as const)(
  '%s uses accessible POS composition and exactly two benefit rows',
  (mode) => {
    const close = jest.fn();
    const view = render(
      wrap(
        <NotificationPermissionView
          state={initial}
          enable={jest.fn()}
          retry={jest.fn()}
          settings={jest.fn()}
          close={close}
        />,
        mode,
      ),
    );
    expect(view.getByRole('header', { name: 'Stay on track with notifications' })).toBeTruthy();
    expect(view.getByText('Timely reminders')).toBeTruthy();
    expect(view.getByText('Upcoming plans')).toBeTruthy();
    expect(view.queryByText('Stay consistent')).toBeNull();
    expect(view.getByText('Reminders for scheduled items').props.allowFontScaling).toBe(true);
    fireEvent.press(view.getByRole('button', { name: 'Not now' }));
    expect(close).toHaveBeenCalledTimes(1);
  },
);
test.each(['Not now', 'Close notification permission'])(
  '%s returns without any native request and ignores later resume',
  async (label) => {
    const view = render(wrap(<NotificationPermissionScreen />));
    await waitFor(() => expect(mockAdapter.check).toHaveBeenCalledTimes(1));
    fireEvent.press(view.getByRole('button', { name: label }));
    expect(mockBack).toHaveBeenCalledWith('/(app)/(tabs)');
    expect(mockAdapter.request).not.toHaveBeenCalled();
    view.unmount();
  },
);
test('explicit enable presents granted state and Continue returns without claiming delivery', async () => {
  const view = render(wrap(<NotificationPermissionScreen />));
  await waitFor(() =>
    expect(
      view.getByRole('button', { name: 'Enable Notifications' }).props.accessibilityState.disabled,
    ).toBe(false),
  );
  fireEvent.press(view.getByRole('button', { name: 'Enable Notifications' }));
  fireEvent.press(view.getByRole('button', { name: 'Enable Notifications' }));
  await waitFor(() => expect(view.getByRole('header', { name: "You're all set!" })).toBeTruthy());
  expect(mockAdapter.request).toHaveBeenCalledTimes(1);
  expect(view.getByText('Notification permission is enabled on this device.')).toBeTruthy();
  expect(view.queryByText(/now receive reminders/)).toBeNull();
  fireEvent.press(view.getByRole('button', { name: 'Continue' }));
  expect(mockBack).toHaveBeenCalledTimes(1);
});
test('already granted does not request and provides device-settings explanation without dead link', async () => {
  mockAdapter.check.mockResolvedValue({ authorization: 'authorized', canAskAgain: false });
  const view = render(wrap(<NotificationPermissionScreen />));
  await waitFor(() => expect(view.getByText("You're all set!")).toBeTruthy());
  expect(view.getByText(/manage notification permission.*device settings/)).toBeTruthy();
  expect(view.queryByRole('button', { name: 'Open Settings' })).toBeNull();
  expect(mockAdapter.request).not.toHaveBeenCalled();
});
test.each(['denied', 'provisional', 'ephemeral'] as const)(
  '%s offers nonblocking settings recovery without full authorization claim',
  async (authorization) => {
    mockAdapter.check.mockResolvedValue({ authorization, canAskAgain: false });
    const view = render(wrap(<NotificationPermissionScreen />));
    await waitFor(() => expect(view.getByRole('button', { name: 'Open Settings' })).toBeTruthy());
    expect(view.queryByText("You're all set!")).toBeNull();
    expect(view.getByRole('button', { name: 'Not now' })).toBeTruthy();
    mockAdapter.openSettings.mockRejectedValueOnce(new Error('private error'));
    fireEvent.press(view.getByRole('button', { name: 'Open Settings' }));
    await waitFor(() =>
      expect(view.getByRole('alert')).toHaveTextContent(/Device settings could not be opened\./),
    );
    expect(view.queryByText(/private error/)).toBeNull();
  },
);
test('check failure is safe, retry only checks, and permission can be enabled afterward', async () => {
  mockAdapter.check.mockRejectedValueOnce(new Error('private error'));
  const view = render(wrap(<NotificationPermissionScreen />));
  await waitFor(() => expect(view.getByRole('button', { name: 'Check again' })).toBeTruthy());
  fireEvent.press(view.getByRole('button', { name: 'Check again' }));
  await waitFor(() =>
    expect(view.getByRole('button', { name: 'Enable Notifications' })).toBeTruthy(),
  );
  expect(mockAdapter.request).not.toHaveBeenCalled();
});
test('foreground/settings return rechecks only while mounted and never requests', async () => {
  let listener!: (state: 'active' | 'background') => void;
  const remove = jest.fn();
  const add = jest.spyOn(AppState, 'addEventListener').mockImplementation((_name, callback) => {
    listener = callback;
    return { remove };
  });
  const adapter: PermissionAdapter = {
    check: jest.fn().mockResolvedValue(initial.permission),
    request: jest.fn(),
    openSettings: jest.fn(),
  };
  const { result, unmount } = renderHook(() => usePermission(adapter));
  await waitFor(() => expect(result.current.state.phase).toBe('ready'));
  act(() => {
    listener('background');
    listener('active');
  });
  await waitFor(() => expect(adapter.check).toHaveBeenCalledTimes(2));
  expect(adapter.request).not.toHaveBeenCalled();
  unmount();
  await act(async () => {
    listener('background');
    listener('active');
  });
  expect(adapter.check).toHaveBeenCalledTimes(2);
  expect(remove).toHaveBeenCalled();
  add.mockRestore();
});
