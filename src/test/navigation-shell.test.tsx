import React from 'react';
import { fireEvent, render } from '@testing-library/react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { NavigationAccessProvider, routes } from '@/navigation';

const mockReplace = jest.fn();
const mockScreenOptions = jest.fn();

jest.mock('@/features/today/PlanningProvider', () => ({
  PlanningSessionScope: ({ children }: React.PropsWithChildren) => children,
}));

jest.mock('@/providers/AppProviders', () => ({
  AppProviders: ({ children }: React.PropsWithChildren) => children,
}));

jest.mock('@/features/auth/integration', () => ({
  PasswordResetLinkIngress: () => null,
}));

jest.mock('@/design-system/theme', () => {
  const actual =
    jest.requireActual<typeof import('@/design-system/theme')>('@/design-system/theme');
  return { ...actual, useTheme: () => actual.createTheme('light') };
});

jest.mock('@/features/foundation/FoundationScreen', () => {
  const ReactModule = jest.requireActual<typeof import('react')>('react');
  const { Text: MockText } = jest.requireActual<typeof import('react-native')>('react-native');
  return {
    FoundationScreen: () => ReactModule.createElement(MockText, null, 'temporary foundation'),
  };
});

jest.mock('expo-router', () => {
  const ReactModule = jest.requireActual<typeof import('react')>('react');
  const { Text: MockText } = jest.requireActual<typeof import('react-native')>('react-native');
  const Stack = ({ children }: React.PropsWithChildren) => children;
  Stack.Screen = ({ name, options }: { name?: string; options?: object }) => {
    mockScreenOptions(name, options);
    return ReactModule.createElement(MockText, null, `screen:${name ?? 'configured'}`);
  };
  return {
    Stack,
    Slot: () => ReactModule.createElement(MockText, null, 'slot'),
    Redirect: ({ href }: { href: string }) =>
      ReactModule.createElement(MockText, null, `redirect:${href}`),
    useRouter: () => ({ replace: mockReplace }),
    usePathname: () => '/welcome',
    useLocalSearchParams: () => ({}),
  };
});

import NotFoundRoute from '../../app/+not-found';
import RootLayout from '../../app/_layout';
import IndexRoute from '../../app/index';
import AppLayout from '../../app/(app)/_layout';

const metrics = {
  frame: { x: 0, y: 0, width: 390, height: 844 },
  insets: { top: 47, right: 0, bottom: 34, left: 0 },
};

function wrap(
  children: React.ReactNode,
  status: 'checking' | 'signedOut' | 'onboarding' | 'signedIn' = 'signedOut',
) {
  return (
    <SafeAreaProvider initialMetrics={metrics}>
      <NavigationAccessProvider status={status}>{children}</NavigationAccessProvider>
    </SafeAreaProvider>
  );
}

beforeEach(() => {
  jest.clearAllMocks();
});

test.each([
  ['signedOut', `redirect:${routes.auth.welcome}`],
  ['onboarding', `redirect:${routes.onboarding.index}`],
  ['signedIn', `redirect:${routes.app.index}`],
] as const)('root entry resolves %s deterministically', (status, expected) => {
  const view = render(wrap(<IndexRoute />, status));
  expect(view.getByText(expected)).toBeTruthy();
});

test('root entry does not flash a destination while access is checking', () => {
  const view = render(wrap(<IndexRoute />, 'checking'));
  expect(view.getByRole('progressbar', { name: 'Restoring access' })).toBeTruthy();
  expect(view.queryByText(/redirect:/)).toBeNull();
});

test.each([
  ['signedOut', routes.auth.welcome],
  ['onboarding', routes.onboarding.index],
] as const)('actual shell stack is never mounted for %s direct entry', (status, destination) => {
  const view = render(wrap(<AppLayout />, status));
  expect(view.getByText(`redirect:${destination}`)).toBeTruthy();
  expect(view.queryByText('screen:(tabs)')).toBeNull();
  expect(view.queryByText('screen:profile')).toBeNull();
  expect(view.queryByText('screen:quick-log')).toBeNull();
});

test('completed users mount the shell stack and checking users see only neutral restoration', () => {
  const completed = render(wrap(<AppLayout />, 'signedIn'));
  expect(completed.getByText('screen:(tabs)')).toBeTruthy();
  expect(completed.getByText('screen:notifications')).toBeTruthy();
  expect(completed.getByText('screen:profile')).toBeTruthy();
  expect(completed.getByText('screen:quick-log')).toBeTruthy();
  expect(mockScreenOptions).toHaveBeenCalledWith(
    'notifications',
    expect.objectContaining({ presentation: 'transparentModal' }),
  );
  expect(mockScreenOptions).toHaveBeenCalledWith(
    'profile',
    expect.objectContaining({ presentation: 'transparentModal' }),
  );
  expect(mockScreenOptions).toHaveBeenCalledWith('quick-log', { presentation: 'card' });
  completed.unmount();
  const checking = render(wrap(<AppLayout />, 'checking'));
  expect(checking.getByRole('progressbar', { name: 'Restoring access' })).toBeTruthy();
  expect(checking.queryByText('screen:(tabs)')).toBeNull();
});

test('root navigation includes public auth, protected app, and not-found routes', () => {
  const view = render(wrap(<RootLayout />));
  expect(view.getByText('screen:index')).toBeTruthy();
  expect(view.getByText('screen:+not-found')).toBeTruthy();
  expect(view.getByText('screen:(auth)')).toBeTruthy();
  expect(view.getByText('screen:(app)')).toBeTruthy();
});

test.each([
  ['signedOut', 'Return to Welcome', routes.auth.welcome],
  ['signedIn', 'Return to POS', routes.app.index],
] as const)(
  'unknown-route recovery respects %s access without echoing a path',
  (status, label, destination) => {
    const view = render(wrap(<NotFoundRoute />, status));
    expect(view.getByRole('header', { name: 'This page is unavailable' })).toBeTruthy();
    expect(view.queryByText(/token=|unknown path|requested URL/i)).toBeNull();
    fireEvent.press(view.getByRole('button', { name: label }));
    expect(mockReplace).toHaveBeenCalledWith(destination);
  },
);
