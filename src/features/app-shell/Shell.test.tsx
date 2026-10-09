import { act, fireEvent, render, waitFor } from '@testing-library/react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { BottomTabBarProps } from 'expo-router/js-tabs';
import { Dimensions, StyleSheet } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { ThemeProvider, createTheme } from '@/design-system/theme';
import { SessionProvider } from '@/features/auth/session';
import { ShellHeader, displayInitials, greeting } from './ShellHeader';
import { PrimaryScreen, SecondaryScreen, ProfileScreen } from './ShellScreens';
import { ShellTabBar } from './ShellTabBar';
import { routes } from '@/navigation';
const mockNavigate = jest.fn(),
  mockBack = jest.fn(),
  mockDismiss = jest.fn(),
  mockLogout = jest.fn();
let mockHoldAnimation = false;
let mockFinishAnimation: ((finished: boolean) => void) | undefined;
jest.mock('react-native-reanimated', () => ({
  ...jest.requireActual('react-native-reanimated/mock'),
  withTiming: (value: number, _config: object, completion?: (finished: boolean) => void) => {
    if (completion) {
      if (mockHoldAnimation) mockFinishAnimation = completion;
      else completion(true);
    }
    return value;
  },
}));
jest.mock('@/features/auth/integration', () => ({
  useAuthenticationCapabilities: () => ({ session: { logout: mockLogout } }),
}));
jest.mock('expo-router', () => ({
  useFocusEffect: (effect: () => void) => jest.requireActual('react').useEffect(effect, [effect]),
  useRouter: () => ({
    navigate: mockNavigate,
    back: mockBack,
    dismiss: mockDismiss,
    replace: jest.fn(),
    canGoBack: () => true,
    canDismiss: () => true,
  }),
}));
const wrap = (children: React.ReactNode, mode: 'light' | 'dark' = 'light') => (
  <SafeAreaProvider
    initialMetrics={{
      frame: { x: 0, y: 0, width: 390, height: 844 },
      insets: { top: 47, right: 0, bottom: 34, left: 0 },
    }}
  >
    <ThemeProvider preference={mode}>
      <SessionProvider
        state={{
          status: 'signedIn',
          account: { accountId: 'fixture', displayName: 'Alex Taylor', onboardingRequired: false },
        }}
      >
        {children}
      </SessionProvider>
    </ThemeProvider>
  </SafeAreaProvider>
);
beforeEach(() => {
  jest.clearAllMocks();
  mockHoldAnimation = false;
  mockFinishAnimation = undefined;
});
test('initials handle missing, blank, single, and multiple names', () => {
  expect(displayInitials()).toBe('POS');
  expect(displayInitials('  ')).toBe('POS');
  expect(displayInitials('Alex')).toBe('A');
  expect(displayInitials('Alex Morgan Taylor')).toBe('AT');
});
test('greeting follows local morning, afternoon and evening', () => {
  expect(greeting(new Date(2026, 9, 1, 8))).toBe('Good morning');
  expect(greeting(new Date(2026, 9, 1, 14))).toBe('Good afternoon');
  expect(greeting(new Date(2026, 9, 1, 20))).toBe('Good evening');
});
test.each(['light', 'dark'] as const)(
  'header uses authoritative name and accessible actions in %s',
  (mode) => {
    const view = render(wrap(<ShellHeader title="Today" />, mode));
    expect(StyleSheet.flatten(view.getByTestId('shell-header').props.style).backgroundColor).toBe(
      createTheme(mode).colors.surfacePrimary,
    );
    expect(view.getByRole('header').props.children).toContain('Alex Taylor');
    fireEvent.press(view.getByLabelText('Open Notifications'));
    fireEvent.press(view.getByLabelText('Open Notifications'));
    expect(mockNavigate).toHaveBeenCalledWith(routes.app.notifications);
    expect(mockNavigate).toHaveBeenCalledTimes(1);
    view.unmount();
    const returned = render(wrap(<ShellHeader title="Plan" />, mode));
    fireEvent.press(returned.getByLabelText('Open Profile'));
    expect(mockNavigate).toHaveBeenCalledWith(routes.app.profile);
  },
);
test.each([
  ['Today', 'Your Today content goes here.'],
  ['Plan', 'Your plan goes here.'],
  ['Focus', 'Your focus content goes here.'],
  ['Review', 'Your review goes here.'],
])('renders %s placeholder', (title, body) => {
  expect(render(wrap(<PrimaryScreen title={title} body={body} />)).getByText(body)).toBeTruthy();
});
test('Quick Log uses regular screen history; Profile modal dismisses with aligned Back and title', () => {
  const secondary = render(
    wrap(<SecondaryScreen title="Quick Log" body="Your quick logging actions go here." />),
  );
  fireEvent.press(secondary.getByLabelText('Back from Quick Log'));
  expect(mockBack).toHaveBeenCalledTimes(1);
  expect(mockDismiss).not.toHaveBeenCalled();
  secondary.unmount();
  const modal = render(
    wrap(<SecondaryScreen title="Profile" body="Your profile content goes here." modal />),
  );
  expect(StyleSheet.flatten(modal.getByTestId('secondary-header').props.style).flexDirection).toBe(
    'row',
  );
  expect(
    StyleSheet.flatten(modal.getByRole('header', { name: 'Profile' }).props.style).textAlign,
  ).toBe('center');
  fireEvent.press(modal.getByLabelText('Back from Profile'));
  expect(mockDismiss).toHaveBeenCalledTimes(1);
});

test.each(['light', 'dark'] as const)(
  'four labeled tabs and unselected Add action in %s',
  (mode) => {
    const names = ['index', 'plan', 'focus', 'review'];
    const titles = ['Today', 'Plan', 'Focus', 'Review'];
    const emit = jest.fn(() => ({ defaultPrevented: false }));
    const navigate = jest.fn();
    const props = {
      state: { index: 1, routes: names.map((name) => ({ name, key: name })) },
      descriptors: Object.fromEntries(
        names.map((name, i) => [name, { options: { title: titles[i] } }]),
      ),
      navigation: { emit, navigate },
    } as unknown as BottomTabBarProps;
    const view = render(wrap(<ShellTabBar {...props} />, mode));
    expect(view.getAllByRole('tab')).toHaveLength(4);
    expect(view.getByRole('tab', { name: 'Plan' }).props.accessibilityState.selected).toBe(true);
    expect(view.getByRole('tab', { name: 'Today' }).props.accessibilityState.selected).toBe(false);
    fireEvent.press(view.getByRole('tab', { name: 'Plan' }));
    expect(navigate).not.toHaveBeenCalled();
    fireEvent.press(view.getByRole('tab', { name: 'Focus' }));
    expect(navigate).toHaveBeenCalledWith('focus');
    const add = view.getByRole('button', { name: 'Open Quick Log' });
    const theme = createTheme(mode);
    expect(StyleSheet.flatten(add.props.style)).toEqual(
      expect.objectContaining({
        width: 44,
        height: 44,
        flexShrink: 0,
        backgroundColor: theme.colors.accentPrimary,
      }),
    );
    expect(view.getByTestId('shell-add-icon', { includeHiddenElements: true }).props).toEqual(
      expect.objectContaining({
        name: 'add',
        size: 28,
        color: theme.colors.onAccent,
      }),
    );
    expect(
      StyleSheet.flatten(view.getByRole('tab', { name: 'Plan' }).props.style).backgroundColor,
    ).toBe(theme.colors.accentSelected);
    expect(add.props.accessibilityState?.selected).toBeUndefined();
    fireEvent.press(add);
    fireEvent.press(add);
    expect(mockNavigate).toHaveBeenCalledTimes(1);
    expect(mockNavigate).toHaveBeenCalledWith(routes.app.quickLog);
  },
);

test('Today catalog targets the generated nested tab index, not the removed app index', () => {
  expect(routes.app.index).toBe('/(app)/(tabs)');
});

test.each(['light', 'dark'] as const)(
  'modern %s modal leaves outside space and dismisses once via backdrop',
  (mode) => {
    const view = render(
      wrap(
        <SecondaryScreen title="Notifications" body="Your notifications go here." modal />,
        mode,
      ),
    );
    const style = StyleSheet.flatten(view.getByTestId('shell-modal-panel').props.style);
    expect(style.width).toBeLessThan(Dimensions.get('window').width - style.marginRight);
    expect(style.marginTop).toBeGreaterThanOrEqual(47);
    expect(style.marginBottom).toBeGreaterThanOrEqual(34);
    expect(style.borderRadius).toBe(createTheme(mode).radii.large);
    expect(
      StyleSheet.flatten(view.getByTestId('secondary-header').props.style).backgroundColor,
    ).toBe(createTheme(mode).colors.accentSoft);
    fireEvent.press(view.getByText('Your notifications go here.'));
    expect(mockDismiss).not.toHaveBeenCalled();
    fireEvent.press(view.getByRole('button', { name: 'Dismiss Notifications' }));
    fireEvent.press(view.getByLabelText('Back from Notifications'));
    expect(mockDismiss).toHaveBeenCalledTimes(1);
  },
);

test.each(['Profile', 'Notifications'])(
  '%s stays mounted until its rightward close animation finishes',
  (title) => {
    mockHoldAnimation = true;
    const view = render(wrap(<SecondaryScreen title={title} body="Placeholder" modal />));
    fireEvent.press(view.getByLabelText(`Back from ${title}`));
    expect(mockDismiss).not.toHaveBeenCalled();
    expect(view.getByTestId('shell-modal-panel')).toBeTruthy();
    fireEvent.press(view.getByLabelText(`Dismiss ${title}`));
    expect(mockDismiss).not.toHaveBeenCalled();
    act(() => mockFinishAnimation?.(true));
    expect(mockDismiss).toHaveBeenCalledTimes(1);
  },
);

test('Profile runs session logout once while busy and clears cached account data', async () => {
  let finish!: () => void;
  mockLogout.mockImplementation(
    () =>
      new Promise<void>((resolve) => {
        finish = resolve;
      }),
  );
  const client = new QueryClient();
  const clear = jest.spyOn(client, 'clear');
  const view = render(
    wrap(
      <QueryClientProvider client={client}>
        <ProfileScreen />
      </QueryClientProvider>,
    ),
  );
  fireEvent.press(view.getByRole('button', { name: 'Log Out' }));
  fireEvent.press(view.getByRole('button', { name: 'Log Out' }));
  expect(mockLogout).toHaveBeenCalledTimes(1);
  expect(view.getByRole('button', { name: 'Log Out' }).props.accessibilityState.disabled).toBe(
    true,
  );
  await act(async () => finish());
  expect(clear).toHaveBeenCalledTimes(1);
});

test('Profile logout failure displays a safe retryable error', async () => {
  mockLogout.mockRejectedValueOnce(new Error('private sentinel'));
  const view = render(
    wrap(
      <QueryClientProvider client={new QueryClient()}>
        <ProfileScreen />
      </QueryClientProvider>,
    ),
  );
  fireEvent.press(view.getByRole('button', { name: 'Log Out' }));
  await waitFor(() => expect(view.getByRole('alert')).toBeTruthy());
  expect(view.queryByText('private sentinel')).toBeNull();
  expect(view.getByRole('button', { name: 'Log Out' }).props.accessibilityState.disabled).toBe(
    false,
  );
});
