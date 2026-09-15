import React from 'react';
import { AccessibilityInfo, KeyboardAvoidingView, ScrollView } from 'react-native';
import { act, fireEvent, render, renderHook, waitFor } from '@testing-library/react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { QueryClientProvider } from '@tanstack/react-query';
import { ThemeProvider, createTheme } from '@/design-system/theme';
import { CodeEntry } from './components/CodeEntry';
import { PasswordField } from './components/AuthFields';
import { AuthAction } from './components/AuthAction';
import { AuthScaffold } from './components/AuthScaffold';
import { PasswordProgress } from './components/PasswordProgress';
import { useAuthReducedMotion } from './presentation/useAuthMotion';
import { VerifyEmailScreen } from './screens/VerifyEmailScreen';
import { CreateAccountScreen } from './screens/CreateAccountScreen';
import { SignInScreen } from './screens/SignInScreen';
import { ResetPasswordScreen } from './screens/ResetPasswordScreen';
import Welcome from '../../../app/(auth)/welcome';
import CreateAccount from '../../../app/(auth)/create-account';
import SignIn from '../../../app/(auth)/sign-in';
import VerifyEmail from '../../../app/(auth)/verify-email';
import ForgotPassword from '../../../app/(auth)/forgot-password';
import ResetSent from '../../../app/(auth)/reset-link-sent';
import ResetPassword from '../../../app/(auth)/reset-password';
import PasswordUpdated from '../../../app/(auth)/password-updated';
import Offline from '../../../app/(auth)/offline';
import RateLimited from '../../../app/(auth)/too-many-attempts';
import Security from '../../../app/(auth)/security-state';
import AuthLayout from '../../../app/(auth)/_layout';
import { createQueryClient } from '@/lib/query/queryClient';
import {
  AuthenticationIntegrationProvider,
  authQueryKeys,
  createRegistrationWorkflow,
} from './integration';

const mockPush = jest.fn();
const mockReplace = jest.fn();
const mockNavigate = jest.fn();
const mockBack = jest.fn();
const mockDismiss = jest.fn();
const mockCanGoBack = jest.fn(() => true);
const mockCanDismiss = jest.fn(() => true);
jest.mock('expo-router', () => {
  const { Text } = jest.requireActual('react-native');
  const Stack = ({
    children,
    screenOptions,
  }: {
    children: React.ReactNode;
    screenOptions: object;
  }) => (
    <Text testID="auth-stack" {...screenOptions}>
      {children}
    </Text>
  );
  Stack.Screen = ({ name, options }: { name: string; options: object }) => (
    <Text testID={`route-${name}`} {...options} />
  );
  return {
    Redirect: ({ href }: { href: string }) => <Text>{`redirect:${href}`}</Text>,
    usePathname: () => '/welcome',
    useLocalSearchParams: () => ({}),
    useRouter: () => ({
      push: mockPush,
      replace: mockReplace,
      navigate: mockNavigate,
      back: mockBack,
      dismiss: mockDismiss,
      canGoBack: mockCanGoBack,
      canDismiss: mockCanDismiss,
    }),
    Stack,
  };
});
jest.mock('react-native-reanimated', () => ({
  ...jest.requireActual('react-native-reanimated/mock'),
  useReducedMotion: () => false,
}));
const metrics = {
  frame: { x: 0, y: 0, width: 390, height: 844 },
  insets: { top: 47, right: 0, bottom: 34, left: 0 },
};
const registration = createRegistrationWorkflow({
  getRegistrationPolicy: jest.fn(async () => ({
    legal_consent_required: false,
    legal_policy_status: 'deferred_nonproduction' as const,
    terms_version: null,
    terms_url: null,
    privacy_version: null,
    privacy_url: null,
  })),
  register: jest.fn(),
  verifyEmail: jest.fn(),
  resendVerification: jest.fn(),
  changeUnverifiedEmail: jest.fn(),
} as never);
const queryClient = createQueryClient();
const passwordRecovery = {
  request: jest.fn(),
  acceptToken: jest.fn(() => true),
  confirm: jest.fn(),
  finishTerminalFailure: jest.fn(),
  clear: jest.fn(),
  getState: () => 'missing' as const,
  subscribe: () => () => undefined,
};
function wrap(children: React.ReactNode, preference: 'light' | 'dark' = 'light') {
  return (
    <SafeAreaProvider initialMetrics={metrics}>
      <ThemeProvider preference={preference}>
        <QueryClientProvider client={queryClient}>
          <AuthenticationIntegrationProvider
            capabilities={{
              inspectBootstrap: jest.fn(),
              clearCredentials: jest.fn(),
              registration,
              session: {
                getState: () => ({ status: 'signedOut' as const }),
                subscribe: () => () => undefined,
                initialize: jest.fn(async () => undefined),
                signIn: jest.fn(),
                refresh: jest.fn(),
                logout: jest.fn(),
                clear: jest.fn(),
              },
              passwordRecovery,
            }}
          >
            {children}
          </AuthenticationIntegrationProvider>
        </QueryClientProvider>
      </ThemeProvider>
    </SafeAreaProvider>
  );
}
async function awaitRegistrationPolicy() {
  await waitFor(() =>
    expect(queryClient.isFetching({ queryKey: authQueryKeys.registrationPolicy })).toBe(0),
  );
}
beforeEach(() => {
  jest.clearAllMocks();
  mockCanGoBack.mockReturnValue(true);
  mockCanDismiss.mockReturnValue(true);
});
const routes = [
  Welcome,
  CreateAccount,
  SignIn,
  VerifyEmail,
  ForgotPassword,
  ResetSent,
  ResetPassword,
  PasswordUpdated,
  Offline,
  RateLimited,
  Security,
];

test.each(routes)('%p renders safely in both themes without excluded controls', async (Route) => {
  for (const mode of ['light', 'dark'] as const) {
    const view = render(wrap(<Route />, mode));
    expect(view.getByRole('header')).toBeTruthy();
    expect(
      view.queryByText(
        /Apple|Google|Remember Me|biometric|Face ID|fingerprint|Touch ID|MFA|passkey|Account Locked|Permission Denied|Quick Access|Contact Support/i,
      ),
    ).toBeNull();
    expect(view.UNSAFE_getByType(KeyboardAvoidingView)).toBeTruthy();
    expect(view.UNSAFE_getByType(ScrollView).props.keyboardShouldPersistTaps).toBe('handled');
    if (Route === CreateAccount) {
      await awaitRegistrationPolicy();
      expect(view.queryByText('Loading registration policy…')).toBeNull();
    }
    await act(async () => {});
    view.unmount();
  }
});
test('Welcome exposes exactly the two approved actions and destinations', async () => {
  const view = render(wrap(<Welcome />));
  const welcomeCta = view.getByRole('button', { name: 'Continue with Email' });
  expect(welcomeCta).toBeEnabled();
  expect(welcomeCta).toHaveStyle({
    backgroundColor: createTheme('light').colors.accentPrimary,
  });
  expect(view.getAllByRole('button')).toHaveLength(2);
  fireEvent.press(welcomeCta);
  expect(mockPush).toHaveBeenCalledWith('/(auth)/sign-in');
  fireEvent.press(view.getByRole('button', { name: 'Create Account' }));
  expect(mockPush).toHaveBeenCalledWith('/(auth)/create-account');
  await act(async () => {});
});
test('password visibility changes secure entry and announces checked state', async () => {
  const view = render(wrap(<PasswordField label="Password" value="" />));
  const toggle = view.getByRole('switch', { name: 'Password visibility' });
  expect(toggle.props.accessibilityState.checked).toBe(false);
  expect(view.getByLabelText('Password').props.secureTextEntry).toBe(true);
  fireEvent.press(toggle);
  expect(view.getByLabelText('Password').props.secureTextEntry).toBe(false);
  expect(view.getByRole('switch').props.accessibilityState.checked).toBe(true);
  fireEvent.press(toggle);
  expect(view.getByLabelText('Password').props.secureTextEntry).toBe(true);
  await act(async () => {});
});
test('password visibility control has an inset trailing margin and back uses an icon button', async () => {
  const view = render(
    wrap(
      <>
        <SignIn />
        <CreateAccount />
      </>,
    ),
  );
  expect(view.getAllByRole('button', { name: 'Back' }).length).toBeGreaterThan(0);
  await awaitRegistrationPolicy();
  const eye = view.getAllByRole('switch', { name: 'Password visibility' })[0];
  expect(eye).toBeTruthy();
  expect(view.getAllByLabelText('Password')[0]).toHaveStyle({
    paddingRight: createTheme('light').controlSizes.inputHeight + createTheme('light').spacing.sm,
  });
  await act(async () => {});
});
test('one accessible code input preserves zeroes, filters paste and supports deletion', async () => {
  const view = render(wrap(<CodeEntry />));
  const input = view.getByLabelText('Six-digit verification code');
  fireEvent.changeText(input, '0a1 2-34567');
  expect(input.props.value).toBe('012345');
  expect(input.props.accessibilityValue.text).toBe('6 of 6 digits entered');
  fireEvent.changeText(input, '01234');
  expect(input.props.value).toBe('01234');
  fireEvent(input, 'focus');
  expect(
    view.getByTestId('code-cell-5', { includeHiddenElements: true }).props.style.borderColor,
  ).toBe(createTheme('light').colors.focusRing);
  fireEvent.changeText(input, '');
  expect(input.props.accessibilityValue.text).toBe('0 of 6 digits entered');
  await act(async () => {});
});
test('scaffold uses semantic surface and central registry role', async () => {
  const view = render(
    wrap(<AuthScaffold title="Example" subtitle="Description" illustration="offline" />, 'dark'),
  );
  expect(view.getByTestId('auth-scaffold').props.style.backgroundColor).toBe(
    createTheme('dark').colors.backgroundPrimary,
  );
  expect(
    view.getByTestId('auth-illustration-offline', { includeHiddenElements: true }).props.style
      .backgroundColor,
  ).toBe(createTheme('dark').colors.accentSoft);
  expect(
    view.getByTestId('auth-illustration-offline', { includeHiddenElements: true }).props
      .accessibilityElementsHidden,
  ).toBe(true);
  await act(async () => {});
});
test('input focus has a semantic ring and forms remain editable without submitting', async () => {
  const view = render(wrap(<SignIn />));
  const email = view.getByLabelText('Email');
  fireEvent.changeText(email, '');
  fireEvent(email, 'focus', {});
  expect(email).toHaveStyle({ borderColor: createTheme('light').colors.focusRing });
  fireEvent.press(view.getByRole('button', { name: 'Sign In' }));
  expect(mockPush).not.toHaveBeenCalled();
  fireEvent.press(view.getByRole('button', { name: 'Forgot Password?' }));
  expect(mockNavigate).toHaveBeenCalledWith('/(auth)/forgot-password');
  await act(async () => {});
});
test('forgot password has modal navigation with a functional close and cold-entry fallback', async () => {
  const layout = render(wrap(<AuthLayout />));
  expect(layout.getByTestId('route-forgot-password').props.presentation).toBe('modal');
  layout.unmount();
  const view = render(wrap(<ForgotPassword />));
  fireEvent.press(view.getByRole('button', { name: 'Close' }));
  expect(mockDismiss).toHaveBeenCalledTimes(1);
  mockCanDismiss.mockReturnValue(false);
  fireEvent.press(view.getByRole('button', { name: 'Close' }));
  expect(mockReplace).toHaveBeenCalledWith('/(auth)/sign-in');
  expect(view.queryByText(/24.hour/i)).toBeNull();
  await act(async () => {});
});
test.each([
  [SignIn, 'Sign In'],
  [CreateAccount, 'Create Account'],
] as const)('%p back falls safely to Welcome after direct entry', async (Route, heading) => {
  mockCanGoBack.mockReturnValue(false);
  const view = render(wrap(<Route />));
  if (Route === CreateAccount) {
    await awaitRegistrationPolicy();
  }
  expect(view.getByRole('header', { name: heading })).toBeTruthy();
  fireEvent.press(view.getByRole('button', { name: 'Back' }));
  expect(mockReplace).toHaveBeenCalledWith('/(auth)/welcome');
  expect(mockBack).not.toHaveBeenCalled();
  await act(async () => {});
});

test('Forgot Password navigation uses one reusable modal destination', async () => {
  const view = render(wrap(<SignIn />));
  fireEvent.press(view.getByRole('button', { name: 'Forgot Password?' }));
  expect(mockNavigate).toHaveBeenCalledWith('/(auth)/forgot-password');
  expect(mockPush).not.toHaveBeenCalledWith('/(auth)/forgot-password');
  await act(async () => {});
});
test('reset acknowledgement remains conditional and never identifies an address', async () => {
  const view = render(wrap(<ResetSent />));
  expect(view.getByText('If that address is eligible, instructions will be sent.')).toBeTruthy();
  expect(view.queryByText(/@|successfully sent|has been sent|account exists/i)).toBeNull();
  await act(async () => {});
});
test('success returns only to Sign In', async () => {
  const view = render(wrap(<PasswordUpdated />));
  fireEvent.press(view.getByRole('button', { name: 'Back to Sign In' }));
  expect(mockReplace).toHaveBeenCalledWith('/(auth)/sign-in');
  expect(mockPush).not.toHaveBeenCalled();
  expect(view.getByRole('alert')).toBeTruthy();
  await act(async () => {});
});
test.each([Offline, RateLimited, Security])(
  'recovery does not retry or reveal internals',
  async (Route) => {
    const view = render(wrap(<Route />));
    expect(view.getByRole('button', { name: 'Try Again' })).toBeDisabled();
    fireEvent.press(view.getByRole('button', { name: 'Try Again' }));
    expect(mockPush).not.toHaveBeenCalled();
    expect(
      view.queryByText(/token|session|429|503|invalid_credentials|locked|disabled account/i),
    ).toBeNull();
    if (Route === RateLimited) expect(view.getByLabelText('Retry time unavailable')).toBeTruthy();
    await act(async () => {});
  },
);
test('verification absent or unmasked data is safely omitted', async () => {
  const view = render(wrap(<VerifyEmailScreen maskedEmail={null} />));
  expect(view.getByText('Enter your six-digit email verification code.')).toBeTruthy();
  view.rerender(wrap(<VerifyEmailScreen maskedEmail="unmasked" />));
  expect(view.queryByText(/unmasked/)).toBeNull();
  await act(async () => {});
});
test('local password guide changes without claiming security or acceptance', async () => {
  const view = render(wrap(<PasswordProgress password="" />));
  expect(view.getByRole('progressbar').props.accessibilityValue.now).toBe(0);
  view.rerender(wrap(<PasswordProgress password={'x'.repeat(18)} />));
  expect(view.getByRole('progressbar').props.accessibilityValue.now).toBe(3);
  expect(view.getByText(/does not confirm password acceptance/)).toBeTruthy();
  await act(async () => {});
});
test('unbound actions are disabled and loading-ready actions expose busy semantics', async () => {
  const view = render(wrap(<AuthAction label="Continue" />));
  expect(view.getByRole('button')).toBeDisabled();
  view.rerender(wrap(<AuthAction label="Continue" loading onPress={jest.fn()} />));
  expect(view.getByRole('button').props.accessibilityState.busy).toBe(true);
  await act(async () => {});
});
test('reduced motion follows system updates', async () => {
  const check = jest.spyOn(AccessibilityInfo, 'isReduceMotionEnabled').mockResolvedValue(false);
  let listener: ((value: boolean) => void) | undefined;
  const remove = jest.fn();
  const subscribe = jest
    .spyOn(AccessibilityInfo, 'addEventListener')
    .mockImplementation((_event, callback) => {
      listener = callback as unknown as (value: boolean) => void;
      return { remove } as unknown as ReturnType<typeof AccessibilityInfo.addEventListener>;
    });
  const hook = renderHook(useAuthReducedMotion);
  await waitFor(() => expect(hook.result.current).toBe(false));
  act(() => listener?.(true));
  expect(hook.result.current).toBe(true);
  hook.unmount();
  expect(remove).toHaveBeenCalled();
  check.mockRestore();
  subscribe.mockRestore();
});

test.each([
  [CreateAccount, 'Create Account'],
  [SignIn, 'Sign In'],
  [VerifyEmail, 'Continue'],
  [ForgotPassword, 'Request Reset Instructions'],
  [ResetPassword, 'Update Password'],
] as const)('submission remains unavailable on %p', async (Route, label) => {
  const view = render(wrap(<Route />));
  if (Route === CreateAccount) {
    await awaitRegistrationPolicy();
  }
  const action = view.getByRole('button', { name: label });
  expect(action).toBeDisabled();
  fireEvent.press(action);
  expect(mockPush).not.toHaveBeenCalled();
  expect(mockReplace).not.toHaveBeenCalled();
  await act(async () => {});
});

test('disabled form actions have a visible semantic disabled treatment', async () => {
  const view = render(wrap(<SignIn />));
  const action = view.getByRole('button', { name: 'Sign In' });
  expect(action).toBeDisabled();
  expect(action).toHaveStyle({
    backgroundColor: createTheme('light').colors.disabledSurface,
    borderColor: createTheme('light').colors.disabledBorder,
    borderWidth: 1,
  });
  expect(view.getAllByText('Sign In')[1]).toHaveStyle({
    color: createTheme('light').colors.disabledContent,
  });
  await act(async () => {});
});

test('Forgot Password request CTA is visible, locally email-gated, and never calls an API', async () => {
  const view = render(wrap(<ForgotPassword />));
  const action = view.getByRole('button', { name: 'Request Reset Instructions' });
  const email = view.getByLabelText('Email');
  expect(action).toBeDisabled();
  expect(view.getByText('Request Reset Instructions')).toBeTruthy();
  expect(view.getByTestId('auth-footer')).toBeTruthy();
  expect(email.props).toEqual(
    expect.objectContaining({
      keyboardType: 'email-address',
      autoCapitalize: 'none',
      autoCorrect: false,
      textContentType: 'emailAddress',
      autoComplete: 'email',
      secureTextEntry: false,
    }),
  );
  expect(email.props.passwordRules).toBeUndefined();
  fireEvent.changeText(email, 'tester');
  expect(action).toBeDisabled();
  fireEvent.changeText(email, 'tester@example.com');
  await waitFor(() => expect(action).toBeEnabled());
  expect(action).toHaveStyle({
    backgroundColor: createTheme('light').colors.accentPrimary,
    borderColor: createTheme('light').colors.accentPrimary,
    opacity: 1,
  });
  fireEvent.press(action);
  expect(mockPush).not.toHaveBeenCalled();
  expect(mockReplace).not.toHaveBeenCalled();
  await act(async () => {});
});

test('Sign In local validation gates its primary action without submitting', async () => {
  const view = render(wrap(<SignIn />));
  const action = view.getByRole('button', { name: 'Sign In' });
  expect(action).toBeDisabled();
  fireEvent.changeText(view.getByLabelText('Email'), 'invalid');
  fireEvent.changeText(view.getByLabelText('Password'), 'local-password');
  expect(action).toBeDisabled();
  fireEvent.changeText(view.getByLabelText('Email'), 'tester@example.com');
  await waitFor(() => expect(action).toBeEnabled());
  expect(action).toHaveStyle({ backgroundColor: createTheme('light').colors.accentPrimary });
  fireEvent.press(action);
  expect(mockPush).not.toHaveBeenCalled();
  expect(mockReplace).not.toHaveBeenCalled();
  await act(async () => {});
});

test('Sign In submits once while pending and clears the password after completion', async () => {
  let finish: ((value: boolean) => void) | undefined;
  const handler = jest.fn(() => new Promise<boolean>((resolve) => void (finish = resolve)));
  const view = render(wrap(<SignInScreen onSubmitIntent={handler} />));
  fireEvent.changeText(view.getByLabelText('Email'), 'person@example.test');
  fireEvent.changeText(view.getByLabelText('Password'), 'user-entered-value');
  const action = view.getByRole('button', { name: 'Sign In' });
  await waitFor(() => expect(action).toBeEnabled());
  fireEvent.press(action);
  fireEvent.press(action);
  await waitFor(() => expect(handler).toHaveBeenCalledTimes(1));
  await act(async () => finish?.(true));
  await waitFor(() => expect(view.getByLabelText('Password').props.value).toBe(''));
});

test('Sign In presents only fixed generic credential failure copy', () => {
  const view = render(wrap(<SignInScreen failureMessage="Email or password is incorrect." />));
  expect(view.getByRole('alert')).toHaveTextContent('Email or password is incorrect.');
  expect(view.queryByText(/account exists|unknown email/i)).toBeNull();
});

test('form CTA becomes the filled-board primary treatment only after local fields are ready', async () => {
  const view = render(wrap(<CreateAccount />));
  await awaitRegistrationPolicy();
  const action = view.getByRole('button', { name: 'Create Account' });
  expect(action).toBeDisabled();
  fireEvent.changeText(view.getByLabelText('Full name'), 'POS Tester');
  fireEvent.changeText(view.getByLabelText('Email'), 'tester@example.com');
  fireEvent.changeText(view.getByLabelText('Password'), 'local-password-1');
  fireEvent.changeText(view.getByLabelText('Confirm password'), 'local-password-1');
  await waitFor(() => expect(action).toBeEnabled());
  expect(action).toHaveStyle({ backgroundColor: createTheme('light').colors.accentPrimary });
  fireEvent.press(action);
  expect(mockPush).not.toHaveBeenCalled();
  await act(async () => {});
});

test('field errors wait for interaction and corrected fields revalidate', async () => {
  const view = render(wrap(<SignIn />));
  expect(view.queryByText('Enter a valid email address.')).toBeNull();
  const email = view.getByLabelText('Email');
  fireEvent.changeText(email, 'invalid');
  expect(view.queryByText('Enter a valid email address.')).toBeNull();
  fireEvent(email, 'blur');
  await waitFor(() => expect(view.getByRole('alert')).toBeTruthy());
  fireEvent.changeText(email, 'tester@example.com');
  fireEvent(email, 'blur');
  await waitFor(() => expect(view.queryByRole('alert')).toBeNull());
});

test('verification and reset readiness are schema-derived and preserve leading zero', async () => {
  const verify = jest.fn();
  const codeView = render(wrap(<VerifyEmailScreen onSubmitIntent={verify} />));
  const continueAction = codeView.getByRole('button', { name: 'Continue' });
  fireEvent.changeText(codeView.getByLabelText('Six-digit verification code'), '012345');
  await waitFor(() => expect(continueAction).toBeEnabled());
  fireEvent.press(continueAction);
  await waitFor(() => expect(verify).toHaveBeenCalledWith({ code: '012345' }));
  codeView.unmount();

  const reset = render(wrap(<ResetPasswordScreen continuationAvailable />));
  const update = reset.getByRole('button', { name: 'Update Password' });
  fireEvent.changeText(reset.getByLabelText('New password'), 'fifteen-characters');
  fireEvent.changeText(reset.getByLabelText('Confirm password'), 'fifteen-characters');
  await waitFor(() => expect(update).toBeEnabled());
});

test('create-account intent excludes the UI-only confirmation password', async () => {
  const handler = jest.fn();
  const view = render(
    wrap(
      <CreateAccountScreen
        onSubmitIntent={handler}
        policy={{ mode: 'deferred', legalConsentRequired: false }}
      />,
    ),
  );
  fireEvent.changeText(view.getByLabelText('Full name'), 'POS Tester');
  fireEvent.changeText(view.getByLabelText('Email'), 'tester@example.com');
  fireEvent.changeText(view.getByLabelText('Password'), 'fifteen-characters');
  fireEvent.changeText(view.getByLabelText('Confirm password'), 'fifteen-characters');
  const action = view.getByRole('button', { name: 'Create Account' });
  await waitFor(() => expect(action).toBeEnabled());
  fireEvent.press(action);
  await waitFor(() =>
    expect(handler).toHaveBeenCalledWith({
      displayName: 'POS Tester',
      email: 'tester@example.com',
      password: 'fifteen-characters',
    }),
  );
});

test('required policy presents separate unchecked consent controls and gates registration', async () => {
  const view = render(
    wrap(
      <CreateAccountScreen
        onSubmitIntent={jest.fn()}
        policy={{
          mode: 'required',
          legalConsentRequired: true,
          termsVersion: 'terms-v1',
          termsUrl: 'https://legal.example.test/terms',
          privacyVersion: 'privacy-v1',
          privacyUrl: 'https://legal.example.test/privacy',
        }}
      />,
    ),
  );
  const terms = view.getByRole('checkbox', { name: 'I accept the Terms of Service' });
  const privacy = view.getByRole('checkbox', { name: 'I accept the Privacy Policy' });
  expect(terms.props.accessibilityState.checked).toBe(false);
  expect(privacy.props.accessibilityState.checked).toBe(false);
  expect(view.getByRole('button', { name: 'Terms of Service' })).toBeEnabled();
  expect(view.getByRole('button', { name: 'Privacy Policy' })).toBeEnabled();
  fireEvent.changeText(view.getByLabelText('Full name'), 'POS Tester');
  fireEvent.changeText(view.getByLabelText('Email'), 'tester@example.com');
  fireEvent.changeText(view.getByLabelText('Password'), 'fifteen-characters');
  fireEvent.changeText(view.getByLabelText('Confirm password'), 'fifteen-characters');
  const create = view.getByRole('button', { name: 'Create Account' });
  await waitFor(() => expect(create).toBeDisabled());
  fireEvent.press(terms);
  expect(create).toBeDisabled();
  fireEvent.press(privacy);
  await waitFor(() => expect(create).toBeEnabled());
});

test('system reduced motion removes navigation and artwork entrance animations', async () => {
  const check = jest.spyOn(AccessibilityInfo, 'isReduceMotionEnabled').mockResolvedValue(true);
  const view = render(
    wrap(
      <>
        <AuthLayout />
        <Welcome />
      </>,
    ),
  );
  await waitFor(() => expect(view.getByTestId('auth-stack').props.animation).toBe('none'));
  expect(view.getByTestId('route-forgot-password').props.animation).toBe('none');
  expect(view.getByTestId('auth-artwork-motion').props.entering).toBeUndefined();
  check.mockRestore();
});
