import React from 'react';
import { render, renderHook } from '@testing-library/react-native';
import { Text as MockText } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { ThemeProvider } from '@/design-system/theme';

const mockBack = jest.fn();
const mockReplace = jest.fn();
const mockDismiss = jest.fn();
const mockCanGoBack = jest.fn();
const mockCanDismiss = jest.fn();
let mockPathname = '/welcome';
let mockParams: { token?: string | string[] } = {};

jest.mock('expo-router', () => ({
  Redirect: ({ href }: { href: string }) => <MockText>{`redirect:${href}`}</MockText>,
  usePathname: () => mockPathname,
  useLocalSearchParams: () => mockParams,
  useRouter: () => ({
    back: mockBack,
    dismiss: mockDismiss,
    replace: mockReplace,
    canGoBack: mockCanGoBack,
    canDismiss: mockCanDismiss,
  }),
}));

jest.mock('@/features/auth/screens/ResetPasswordScreen', () => ({
  ResetPasswordScreen: ({ continuationAvailable }: { continuationAvailable: boolean }) => (
    <MockText>
      {continuationAvailable ? 'reset continuation ready' : 'reset continuation unavailable'}
    </MockText>
  ),
}));

import {
  AuthRouteBoundary,
  ProtectedAppBoundary,
  ResetPasswordRouteBoundary,
} from './NavigationBoundaries';
import { NavigationAccessProvider } from './NavigationAccessProvider';
import { routes } from './routes';
import { useSafeNavigation } from './useSafeNavigation';

const metrics = {
  frame: { x: 0, y: 0, width: 390, height: 844 },
  insets: { top: 47, right: 0, bottom: 34, left: 0 },
};

function wrap(children: React.ReactNode, status: 'checking' | 'signedOut' | 'signedIn') {
  return (
    <SafeAreaProvider initialMetrics={metrics}>
      <ThemeProvider preference="light">
        <NavigationAccessProvider status={status}>{children}</NavigationAccessProvider>
      </ThemeProvider>
    </SafeAreaProvider>
  );
}

beforeEach(() => {
  jest.clearAllMocks();
  mockPathname = '/welcome';
  mockParams = {};
  mockCanGoBack.mockReturnValue(true);
  mockCanDismiss.mockReturnValue(true);
});

test('checking renders an accessible restoration state without auth or protected content', () => {
  const auth = render(
    wrap(
      <AuthRouteBoundary>
        <MockText>auth content</MockText>
      </AuthRouteBoundary>,
      'checking',
    ),
  );
  expect(auth.getByRole('progressbar', { name: 'Restoring access' })).toBeTruthy();
  expect(auth.queryByText('auth content')).toBeNull();

  const app = render(
    wrap(
      <ProtectedAppBoundary>
        <MockText>protected content</MockText>
      </ProtectedAppBoundary>,
      'checking',
    ),
  );
  expect(app.getByRole('progressbar', { name: 'Restoring access' })).toBeTruthy();
  expect(app.queryByText('protected content')).toBeNull();
});

test('signed-out protected access redirects without rendering protected content', () => {
  const view = render(
    wrap(
      <ProtectedAppBoundary>
        <MockText>temporary foundation</MockText>
      </ProtectedAppBoundary>,
      'signedOut',
    ),
  );
  expect(view.getByText(`redirect:${routes.auth.welcome}`)).toBeTruthy();
  expect(view.queryByText('temporary foundation')).toBeNull();
});

test('injected signed-in access reaches the temporary protected foundation', () => {
  const view = render(
    wrap(
      <ProtectedAppBoundary>
        <MockText>temporary foundation</MockText>
      </ProtectedAppBoundary>,
      'signedIn',
    ),
  );
  expect(view.getByText('temporary foundation')).toBeTruthy();
  expect(view.queryByText(/redirect:/)).toBeNull();
});

test('signed-in entry routes redirect while recovery routes remain available', () => {
  const entry = render(
    wrap(
      <AuthRouteBoundary>
        <MockText>Welcome</MockText>
      </AuthRouteBoundary>,
      'signedIn',
    ),
  );
  expect(entry.getByText(`redirect:${routes.app.index}`)).toBeTruthy();
  expect(entry.queryByText('Welcome')).toBeNull();

  mockPathname = '/reset-password';
  const recovery = render(
    wrap(
      <AuthRouteBoundary>
        <MockText>Reset Password</MockText>
      </AuthRouteBoundary>,
      'signedIn',
    ),
  );
  expect(recovery.getByText('Reset Password')).toBeTruthy();
});

test('reset-link parameters fail closed for missing, malformed, and repeated values', () => {
  const missing = render(wrap(<ResetPasswordRouteBoundary />, 'signedOut'));
  expect(missing.getByText('reset continuation unavailable')).toBeTruthy();

  mockParams = { token: ['x'.repeat(32), 'y'.repeat(32)] };
  const repeated = render(wrap(<ResetPasswordRouteBoundary />, 'signedOut'));
  expect(repeated.getByText('reset continuation unavailable')).toBeTruthy();

  const token = 'x'.repeat(32);
  mockParams = { token };
  const valid = render(wrap(<ResetPasswordRouteBoundary />, 'signedOut'));
  expect(valid.getByText('reset continuation ready')).toBeTruthy();
  expect(JSON.stringify(valid.toJSON())).not.toContain(token);
});

test('safe back uses history once and otherwise replaces with its allow-listed fallback', () => {
  const hook = renderHook(useSafeNavigation);
  hook.result.current.backOrReplace(routes.auth.welcome);
  expect(mockBack).toHaveBeenCalledTimes(1);
  expect(mockReplace).not.toHaveBeenCalled();

  mockCanGoBack.mockReturnValue(false);
  hook.result.current.backOrReplace(routes.auth.signIn);
  expect(mockReplace).toHaveBeenCalledWith(routes.auth.signIn);
});

test('modal close dismisses normally and replaces with Sign In after cold entry', () => {
  const hook = renderHook(useSafeNavigation);
  hook.result.current.dismissOrReplace(routes.auth.signIn);
  expect(mockDismiss).toHaveBeenCalledTimes(1);
  expect(mockReplace).not.toHaveBeenCalled();

  mockCanDismiss.mockReturnValue(false);
  hook.result.current.dismissOrReplace(routes.auth.signIn);
  expect(mockReplace).toHaveBeenCalledWith(routes.auth.signIn);
});
