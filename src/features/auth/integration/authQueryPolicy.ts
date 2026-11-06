export const authMutationKeys = {
  register: ['auth', 'register'],
  verifyEmail: ['auth', 'verify-email'],
  resendVerification: ['auth', 'resend-verification'],
  changeUnverifiedEmail: ['auth', 'change-unverified-email'],
  signIn: ['auth', 'sign-in'],
  refresh: ['auth', 'refresh'],
  signOut: ['auth', 'sign-out'],
  requestPasswordReset: ['auth', 'request-password-reset'],
  confirmPasswordReset: ['auth', 'confirm-password-reset'],
} as const;
export const authQueryKeys = { registrationPolicy: ['auth', 'registration-policy'] } as const;
export const authQueryPolicy = {
  retry: false,
  gcTime: 0,
  staleTime: 0,
  networkMode: 'always',
} as const;
export const authMutationPolicy = { retry: false, networkMode: 'always', gcTime: 0 } as const;
export interface SensitiveMutationHandle {
  reset(): void;
}
export function clearSensitiveMutation(handle: SensitiveMutationHandle) {
  handle.reset();
}
