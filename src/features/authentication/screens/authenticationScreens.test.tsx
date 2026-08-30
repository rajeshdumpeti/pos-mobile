import React from 'react';
import { act, fireEvent, render } from '@testing-library/react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { ThemeMode, ThemeProvider } from '@/design-system/theme';
import { PasswordStrength } from '@/features/authentication/components';
import { authRoutes, demoCredentials } from '@/features/authentication/constants/authentication';

import { AuthStatePreviewScreen } from './AuthStatePreviewScreen';
import { BiometricSetupScreen } from './BiometricSetupScreen';
import { CreateAccountScreen } from './CreateAccountScreen';
import { ForgotPasswordScreen } from './ForgotPasswordScreen';
import { ResetPasswordScreen } from './ResetPasswordScreen';
import { SignInScreen } from './SignInScreen';
import { SuccessScreen } from './SuccessScreen';
import { VerifyEmailScreen } from './VerifyEmailScreen';
import { WelcomeScreen } from './WelcomeScreen';

const initialMetrics = {
  frame: { x: 0, y: 0, width: 390, height: 844 },
  insets: { top: 47, left: 0, right: 0, bottom: 34 },
};

function renderAuth(ui: React.ReactElement, mode: ThemeMode = 'light') {
  return render(
    <SafeAreaProvider initialMetrics={initialMetrics}>
      <ThemeProvider preference={mode}>{ui}</ThemeProvider>
    </SafeAreaProvider>,
  );
}

test('welcome renders and exposes primary navigation plus quick access', () => {
  const onNavigate = jest.fn();
  const view = renderAuth(<WelcomeScreen onNavigate={onNavigate} />);

  expect(view.getByRole('header', { name: 'Welcome Back' })).toBeTruthy();
  fireEvent.press(view.getByRole('button', { name: 'Continue with Email' }));
  expect(onNavigate).toHaveBeenCalledWith(authRoutes.signIn);

  fireEvent.press(view.getByRole('button', { name: 'Preview authentication flow' }));
  expect(view.getByRole('header', { name: 'Authentication quick access' })).toBeTruthy();
});

test('provider actions explain the local-only preview before continuing', () => {
  const onNavigate = jest.fn();
  const view = renderAuth(<WelcomeScreen onNavigate={onNavigate} />);

  fireEvent.press(view.getByRole('button', { name: 'Continue with Apple' }));
  expect(view.getByRole('header', { name: 'Apple sign-in preview' })).toBeTruthy();
  expect(
    view.getByText('This is a local demonstration only. No provider sign-in occurred.'),
  ).toBeTruthy();
  expect(onNavigate).not.toHaveBeenCalled();

  fireEvent.press(view.getByRole('button', { name: 'Continue Local Preview' }));
  expect(onNavigate).toHaveBeenCalledWith(authRoutes.success);
});

test('create account explains validation and exposes accessible password controls', () => {
  const onNavigate = jest.fn();
  const view = renderAuth(<CreateAccountScreen onNavigate={onNavigate} />);

  fireEvent.press(view.getByRole('button', { name: 'Create Account' }));
  expect(view.getByText('Error: Enter your full name.')).toBeTruthy();
  expect(view.getByText('Error: Accept the Terms and Privacy Policy.')).toBeTruthy();

  const showPassword = view.getByRole('button', { name: 'Show Password' });
  fireEvent.press(showPassword);
  expect(view.getByRole('button', { name: 'Hide Password' })).toBeTruthy();

  fireEvent.changeText(view.getByLabelText('Full name'), 'Taylor Morgan');
  fireEvent.changeText(view.getByLabelText('Email'), 'taylor@example.com');
  fireEvent.changeText(view.getByLabelText('Password'), 'CalmDay1');
  fireEvent.changeText(view.getByLabelText('Confirm password'), 'CalmDay1');
  fireEvent.press(view.getByRole('checkbox', { name: 'I accept the Terms and Privacy Policy' }));
  fireEvent.press(view.getByRole('button', { name: 'Create Account' }));
  expect(onNavigate).toHaveBeenCalledWith(authRoutes.verifyEmail);
});

test('terms sheet is reachable and clearly marked for legal review', () => {
  const view = renderAuth(<CreateAccountScreen onNavigate={jest.fn()} />);
  fireEvent.press(view.getByRole('button', { name: 'Terms' }));
  expect(view.getByRole('header', { name: 'Terms of Service' })).toBeTruthy();
  expect(view.getByText(/Draft copy — legal review required before release/)).toBeTruthy();
});

test('sign in shows loading, disables the action, and follows the local demo flow', () => {
  jest.useFakeTimers();
  const onNavigate = jest.fn();
  const view = renderAuth(<SignInScreen onNavigate={onNavigate} onBack={jest.fn()} />);

  fireEvent.changeText(view.getByLabelText('Email'), demoCredentials.email);
  fireEvent.changeText(view.getByLabelText('Password'), demoCredentials.password);
  fireEvent.press(view.getByRole('button', { name: 'Sign In' }));

  expect(view.getByRole('button', { name: 'Sign In' }).props.accessibilityState).toEqual({
    disabled: true,
    busy: true,
  });
  expect(view.getByLabelText('Email').props.accessibilityState).toEqual({ disabled: true });
  expect(view.getByLabelText('Password').props.accessibilityState).toEqual({ disabled: true });
  expect(view.getByRole('button', { name: 'Show Password' }).props.accessibilityState).toEqual({
    disabled: true,
  });
  expect(view.getByRole('checkbox', { name: 'Remember Me' }).props.accessibilityState).toEqual({
    checked: false,
    disabled: true,
  });
  expect(view.getByRole('button', { name: 'Forgot Password' }).props.accessibilityState).toEqual({
    disabled: true,
  });
  expect(
    view.getByRole('button', { name: 'Continue with Apple' }).props.accessibilityState,
  ).toEqual({ disabled: true });
  expect(
    view.getByRole('button', { name: 'Continue with Google' }).props.accessibilityState,
  ).toEqual({ disabled: true });
  expect(
    view.getByRole('button', { name: 'Preview security states' }).props.accessibilityState,
  ).toEqual({ disabled: true });
  expect(view.getByRole('button', { name: 'Go back' }).props.accessibilityState).toEqual({
    disabled: true,
  });
  expect(view.getByText('Signing you in')).toBeTruthy();

  fireEvent.changeText(view.getByLabelText('Email'), 'changed@example.com');
  act(() => jest.advanceTimersByTime(500));
  expect(onNavigate).toHaveBeenCalledWith(authRoutes.biometricSetup);
  jest.useRealTimers();
});

test('invalid credentials remain visible with a recovery action', () => {
  jest.useFakeTimers();
  const view = renderAuth(<SignInScreen onNavigate={jest.fn()} />);
  fireEvent.changeText(view.getByLabelText('Email'), 'person@example.com');
  fireEvent.changeText(view.getByLabelText('Password'), 'WrongPassword1');
  fireEvent.press(view.getByRole('button', { name: 'Sign In' }));
  act(() => jest.advanceTimersByTime(500));
  expect(view.getByText('Those details do not match')).toBeTruthy();
  expect(view.getByRole('button', { name: 'Reset Password' })).toBeTruthy();
  jest.useRealTimers();
});

test('verification and password recovery success states are locally reachable', () => {
  const verifyNavigate = jest.fn();
  const verifyView = renderAuth(<VerifyEmailScreen onNavigate={verifyNavigate} />);
  fireEvent.changeText(verifyView.getByLabelText('Verification code'), '123456');
  fireEvent.press(verifyView.getByRole('button', { name: 'Continue' }));
  expect(verifyNavigate).toHaveBeenCalledWith(authRoutes.biometricSetup);
  verifyView.unmount();

  const forgotView = renderAuth(<ForgotPasswordScreen onNavigate={jest.fn()} />);
  fireEvent.changeText(forgotView.getByLabelText('Email'), 'person@example.com');
  fireEvent.press(forgotView.getByRole('button', { name: 'Send Reset Link' }));
  expect(forgotView.getByText('Reset link sent')).toBeTruthy();
});

test('reset password and biometric denial states provide next actions', () => {
  const resetView = renderAuth(<ResetPasswordScreen onNavigate={jest.fn()} />);
  fireEvent.changeText(resetView.getByLabelText('New password'), 'CalmDay1');
  fireEvent.changeText(resetView.getByLabelText('Confirm new password'), 'CalmDay1');
  fireEvent.press(resetView.getByRole('button', { name: 'Update Password' }));
  expect(resetView.getByText('Password updated')).toBeTruthy();
  resetView.unmount();

  const biometricView = renderAuth(<BiometricSetupScreen onNavigate={jest.fn()} />);
  fireEvent.press(biometricView.getByRole('button', { name: 'Preview permission denied' }));
  expect(biometricView.getByText('Biometric access unavailable')).toBeTruthy();
  expect(biometricView.getByRole('button', { name: 'Continue Without Biometrics' })).toBeTruthy();
});

test('password strength announces every requirement as met or missing', () => {
  const view = renderAuth(<PasswordStrength password="CalmDay" />);
  expect(view.getByLabelText('8+ characters, missing')).toBeTruthy();
  expect(view.getByLabelText('One uppercase character, met')).toBeTruthy();
  expect(view.getByLabelText('One number or symbol, missing')).toBeTruthy();
});

test('biometric options expose mutually exclusive radio semantics', () => {
  const view = renderAuth(<BiometricSetupScreen onNavigate={jest.fn()} />);
  const faceId = view.getByRole('radio', { name: 'Face ID' });
  const touchId = view.getByRole('radio', { name: 'Touch ID' });

  expect(faceId.props.accessibilityState).toEqual({ checked: true });
  expect(touchId.props.accessibilityState).toEqual({ checked: false });
  fireEvent.press(touchId);
  expect(view.getByRole('radio', { name: 'Face ID' }).props.accessibilityState).toEqual({
    checked: false,
  });
  expect(view.getByRole('radio', { name: 'Touch ID' }).props.accessibilityState).toEqual({
    checked: true,
  });
});

test('success explains the local boundary and continues to the existing POS shell', () => {
  const onContinue = jest.fn();
  const view = renderAuth(<SuccessScreen onContinue={onContinue} />);
  expect(view.getByRole('header', { name: 'You’re Ready' })).toBeTruthy();
  expect(view.getByText(/No account or session was created/)).toBeTruthy();
  fireEvent.press(view.getByRole('button', { name: 'Continue to POS' }));
  expect(onContinue).toHaveBeenCalledTimes(1);
});

test('all required presentation states are exposed in the development preview', () => {
  const view = renderAuth(<AuthStatePreviewScreen onNavigate={jest.fn()} />);
  expect(view.getByText('You appear to be offline')).toBeTruthy();
  expect(view.getByText('Account temporarily locked')).toBeTruthy();
  expect(view.getByText('Too many attempts')).toBeTruthy();
  expect(view.getByText('Email not verified')).toBeTruthy();
});

test.each<ThemeMode>(['light', 'dark'])('welcome renders in %s mode', (mode) => {
  const view = renderAuth(<WelcomeScreen onNavigate={jest.fn()} />, mode);
  expect(view.getByRole('header', { name: 'Welcome Back' })).toBeTruthy();
});

test('reset password renders in dark mode', () => {
  const view = renderAuth(<ResetPasswordScreen onNavigate={jest.fn()} />, 'dark');
  expect(view.getByRole('header', { name: 'Reset Password' })).toBeTruthy();
  expect(view.getByLabelText('8+ characters, missing')).toBeTruthy();
});
