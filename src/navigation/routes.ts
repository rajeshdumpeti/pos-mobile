import type { Href } from 'expo-router';

export const routes = {
  root: '/',
  auth: {
    welcome: '/(auth)/welcome',
    createAccount: '/(auth)/create-account',
    signIn: '/(auth)/sign-in',
    verifyEmail: '/(auth)/verify-email',
    forgotPassword: '/(auth)/forgot-password',
    resetLinkSent: '/(auth)/reset-link-sent',
    resetPassword: '/(auth)/reset-password',
    passwordUpdated: '/(auth)/password-updated',
    offline: '/(auth)/offline',
    tooManyAttempts: '/(auth)/too-many-attempts',
    securityState: '/(auth)/security-state',
  },
  app: {
    index: '/(app)',
  },
  onboarding: {
    index: '/(onboarding)' as Href,
  },
} as const satisfies {
  root: Href;
  auth: Record<string, Href>;
  app: Record<string, Href>;
  onboarding: Record<string, Href>;
};

export type SafeFallbackRoute =
  typeof routes.auth.welcome | typeof routes.auth.signIn | typeof routes.app.index;
