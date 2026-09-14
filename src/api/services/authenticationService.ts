import type { components } from '../generated/schema';
import type { HttpRequest } from '../client';
type S = components['schemas'];
type Request = <R, B = never>(input: HttpRequest<B>) => Promise<R>;
export function createAuthenticationService(request: Request) {
  return {
    getRegistrationPolicy: () =>
      request<S['RegistrationPolicyResponse']>({
        path: '/api/v1/auth/registration-policy',
        method: 'GET',
        expectedStatuses: [200],
      }),
    register: (body: S['RegistrationRequest']) =>
      request<S['PendingVerificationResponse'], S['RegistrationRequest']>({
        path: '/api/v1/auth/registrations',
        method: 'POST',
        body,
        expectedStatuses: [202],
      }),
    verifyEmail: (body: S['ConfirmEmailRequest']) =>
      request<S['EmailVerifiedResponse'], S['ConfirmEmailRequest']>({
        path: '/api/v1/auth/email-verifications/confirm',
        method: 'POST',
        body,
        expectedStatuses: [201],
      }),
    resendVerification: (body: S['ResendVerificationRequest']) =>
      request<S['PendingVerificationResponse'], S['ResendVerificationRequest']>({
        path: '/api/v1/auth/email-verifications/resend',
        method: 'POST',
        body,
        expectedStatuses: [202],
      }),
    changeUnverifiedEmail: (body: S['ChangeUnverifiedEmailRequest']) =>
      request<S['PendingVerificationResponse'], S['ChangeUnverifiedEmailRequest']>({
        path: '/api/v1/auth/email-verifications/email',
        method: 'PATCH',
        body,
        expectedStatuses: [202],
      }),
    signIn: (body: S['SignInRequest']) =>
      request<S['SessionTokenResponse'], S['SignInRequest']>({
        path: '/api/v1/auth/sessions',
        method: 'POST',
        body,
        expectedStatuses: [200],
      }),
    refresh: (body: S['RefreshSessionRequest'], idempotencyKey: string) =>
      request<S['SessionTokenResponse'], S['RefreshSessionRequest']>({
        path: '/api/v1/auth/sessions/refresh',
        method: 'POST',
        body,
        idempotencyKey,
        expectedStatuses: [200],
      }),
    getCurrentSession: (credential: string) =>
      request<S['CurrentSessionResponse']>({
        path: '/api/v1/auth/session',
        method: 'GET',
        credential,
        expectedStatuses: [200],
      }),
    signOut: (credential: string) =>
      request<void>({
        path: '/api/v1/auth/session',
        method: 'DELETE',
        credential,
        expectedStatuses: [204],
      }),
    signOutAll: (credential: string) =>
      request<void>({
        path: '/api/v1/auth/sessions',
        method: 'DELETE',
        credential,
        expectedStatuses: [204],
      }),
    requestPasswordReset: (body: S['PasswordResetRequest']) =>
      request<S['PasswordResetAcceptedResponse'], S['PasswordResetRequest']>({
        path: '/api/v1/auth/password-resets',
        method: 'POST',
        body,
        expectedStatuses: [202],
      }),
    confirmPasswordReset: (body: S['ConfirmPasswordResetRequest']) =>
      request<void, S['ConfirmPasswordResetRequest']>({
        path: '/api/v1/auth/password-resets/confirm',
        method: 'POST',
        body,
        expectedStatuses: [204],
      }),
  };
}

export type AuthenticationService = ReturnType<typeof createAuthenticationService>;
