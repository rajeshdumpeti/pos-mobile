export const authRoutes = {
  welcome: '/(auth)/welcome',
  createAccount: '/(auth)/create-account',
  signIn: '/(auth)/sign-in',
  verifyEmail: '/(auth)/verify-email',
  forgotPassword: '/(auth)/forgot-password',
  resetPassword: '/(auth)/reset-password',
  biometricSetup: '/(auth)/biometric-setup',
  success: '/(auth)/success',
  preview: '/(auth)/preview',
} as const;

export type AuthRoutePath = (typeof authRoutes)[keyof typeof authRoutes];

export const authRouteLinks: ReadonlyArray<{ label: string; path: AuthRoutePath }> = [
  { label: 'Welcome', path: authRoutes.welcome },
  { label: 'Create Account', path: authRoutes.createAccount },
  { label: 'Sign In', path: authRoutes.signIn },
  { label: 'Verify Email', path: authRoutes.verifyEmail },
  { label: 'Forgot Password', path: authRoutes.forgotPassword },
  { label: 'Reset Password', path: authRoutes.resetPassword },
  { label: 'Biometric Setup', path: authRoutes.biometricSetup },
  { label: 'Success', path: authRoutes.success },
  { label: 'State Preview', path: authRoutes.preview },
];

export type AuthPresentationState =
  | 'signingIn'
  | 'offline'
  | 'invalidCredentials'
  | 'emailNotVerified'
  | 'accountLocked'
  | 'tooManyAttempts'
  | 'passwordUpdated'
  | 'passwordResetSent'
  | 'biometricPermissionDenied';

export const authStateContent: Record<
  AuthPresentationState,
  { title: string; message: string; actionLabel: string }
> = {
  signingIn: {
    title: 'Signing you in',
    message: 'Checking your local demonstration details.',
    actionLabel: 'Cancel',
  },
  offline: {
    title: 'You appear to be offline',
    message: 'Reconnect, then try again. Your existing POS experience remains available.',
    actionLabel: 'Try Again',
  },
  invalidCredentials: {
    title: 'Those details do not match',
    message: 'Check your email and password, or reset your password to continue.',
    actionLabel: 'Reset Password',
  },
  emailNotVerified: {
    title: 'Email not verified',
    message: 'Enter the latest six-digit code or request a new one.',
    actionLabel: 'Resend Code',
  },
  accountLocked: {
    title: 'Account temporarily locked',
    message: 'For your security, sign-in is paused. Use account recovery to continue.',
    actionLabel: 'Recover Account',
  },
  tooManyAttempts: {
    title: 'Too many attempts',
    message: 'Wait a moment before trying again, or reset your password now.',
    actionLabel: 'Reset Password',
  },
  passwordUpdated: {
    title: 'Password updated',
    message: 'Your demonstration password is ready. You can return to sign in.',
    actionLabel: 'Return to Sign In',
  },
  passwordResetSent: {
    title: 'Reset link sent',
    message: 'If this were connected, instructions would be sent to your email.',
    actionLabel: 'Open Reset Demo',
  },
  biometricPermissionDenied: {
    title: 'Biometric access unavailable',
    message: 'Permission was not granted. You can continue without biometric access.',
    actionLabel: 'Continue Without Biometrics',
  },
};

export type AuthSheetKind =
  'forgotPassword' | 'changeEmail' | 'terms' | 'privacy' | 'biometricInfo';

export const authSheetContent: Record<
  AuthSheetKind,
  { title: string; body: string; actionLabel?: string }
> = {
  forgotPassword: {
    title: 'Forgot your password?',
    body: 'We will guide you through a local recovery preview. No email or account service is connected.',
    actionLabel: 'Continue to Recovery',
  },
  changeEmail: {
    title: 'Change email',
    body: 'Return to account creation to update the demonstration email address before requesting another code.',
    actionLabel: 'Edit Email',
  },
  terms: {
    title: 'Terms of Service',
    body: 'Draft copy — legal review required before release. POS should be used responsibly and according to the final published terms.',
  },
  privacy: {
    title: 'Privacy Policy',
    body: 'Draft copy — legal review required before release. POS is designed to treat personal life data as sensitive and private.',
  },
  biometricInfo: {
    title: 'About biometric access',
    body: 'Biometric access is optional. This preview never requests permission or reads device biometric information.',
  },
};

export const demoCredentials = {
  email: 'demo@pos.local',
  password: 'Password1',
  verificationCode: '123456',
} as const;
