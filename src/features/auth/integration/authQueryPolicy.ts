export const authMutationKeys = {
  register: ['auth', 'register'],
  verifyEmail: ['auth', 'verify-email'],
  resendVerification: ['auth', 'resend-verification'],
  signIn: ['auth', 'sign-in'],
  refresh: ['auth', 'refresh'],
  signOut: ['auth', 'sign-out'],
  requestPasswordReset: ['auth', 'request-password-reset'],
  confirmPasswordReset: ['auth', 'confirm-password-reset'],
} as const;
export const authMutationPolicy = { retry: false, networkMode: 'always', gcTime: 0 } as const;
export interface SensitiveMutationHandle {
  reset(): void;
}
export function clearSensitiveMutation(handle: SensitiveMutationHandle) {
  handle.reset();
}
