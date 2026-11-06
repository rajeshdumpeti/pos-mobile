import { createRegistrationWorkflow, validateRegistrationPolicy } from './registrationWorkflow';

const pending = (token = 'opaque-flow-token') => ({
  status: 'registration_pending' as const,
  flow_token: token,
  masked_email: 'p***@example.test',
  verification_expires_at: '2026-09-10T12:10:00Z',
  flow_expires_at: '2026-09-10T12:30:00Z',
  resend_available_at: '2026-09-10T12:01:00Z',
});

function service() {
  return {
    getRegistrationPolicy: jest.fn(),
    register: jest.fn(async (_body: unknown) => pending()),
    verifyEmail: jest.fn(async (_body: unknown) => ({
      status: 'email_verified' as const,
      account_id: '00000000-0000-4000-8000-000000000001',
      onboarding_required: true,
      session: null,
      next_action: 'await_session_establishment' as const,
    })),
    resendVerification: jest.fn(async (_body: unknown) => pending('rotated-resend-token')),
    changeUnverifiedEmail: jest.fn(async (_body: unknown) => pending('rotated-change-token')),
  };
}

test('validates only the two authoritative policy relationships', () => {
  expect(
    validateRegistrationPolicy({
      legal_consent_required: false,
      legal_policy_status: 'deferred_nonproduction',
      terms_version: null,
      terms_url: null,
      privacy_version: null,
      privacy_url: null,
    }),
  ).toEqual({ mode: 'deferred', legalConsentRequired: false });
  expect(() =>
    validateRegistrationPolicy({
      legal_consent_required: true,
      legal_policy_status: 'active',
      terms_version: 'terms-v1',
      terms_url: 'javascript:alert(1)',
      privacy_version: 'privacy-v1',
      privacy_url: 'https://legal.example.test/privacy',
    }),
  ).toThrow('invalid');
});

test('deferred registration omits every legal field and confirmation password', async () => {
  const api = service();
  const workflow = createRegistrationWorkflow(api as never);
  await workflow.register({
    displayName: 'POS Tester',
    email: 'person@example.test',
    password: 'private-password',
    policy: { mode: 'deferred', legalConsentRequired: false },
  });
  expect(api.register).toHaveBeenCalledWith({
    display_name: 'POS Tester',
    email: 'person@example.test',
    password: 'private-password',
  });
  expect(JSON.stringify(api.register.mock.calls[0]![0])).not.toMatch(
    /terms_|privacy_|confirmPassword/,
  );
});

test('required registration submits exact backend versions and affirmative consent', async () => {
  const api = service();
  const workflow = createRegistrationWorkflow(api as never);
  await workflow.register({
    displayName: 'POS Tester',
    email: 'person@example.test',
    password: 'private-password',
    policy: {
      mode: 'required',
      legalConsentRequired: true,
      termsVersion: 'terms-v1',
      termsUrl: 'https://legal.example.test/terms',
      privacyVersion: 'privacy-v1',
      privacyUrl: 'https://legal.example.test/privacy',
    },
  });
  expect(api.register).toHaveBeenCalledWith(
    expect.objectContaining({
      terms_accepted: true,
      privacy_accepted: true,
      terms_version: 'terms-v1',
      privacy_version: 'privacy-v1',
    }),
  );
});

test('verification, resend, and change email keep flow private and rotate it', async () => {
  const api = service();
  const workflow = createRegistrationWorkflow(api as never);
  await workflow.register({
    displayName: 'POS Tester',
    email: 'person@example.test',
    password: 'private-password',
    policy: { mode: 'deferred', legalConsentRequired: false },
  });
  await workflow.verifyEmail('012345');
  expect(api.verifyEmail).toHaveBeenCalledWith({ flow_token: 'opaque-flow-token', code: '012345' });
  await workflow.resendVerification();
  await workflow.changeUnverifiedEmail('new@example.test');
  expect(api.resendVerification).toHaveBeenCalledWith({ flow_token: 'opaque-flow-token' });
  expect(api.changeUnverifiedEmail).toHaveBeenCalledWith({
    flow_token: 'rotated-resend-token',
    new_email: 'new@example.test',
  });
  expect(workflow.getVerificationPresentation()).not.toHaveProperty('flowToken');
});

test('clear removes flow and missing context fails without an API call', async () => {
  const api = service();
  const workflow = createRegistrationWorkflow(api as never);
  workflow.clear();
  expect(workflow.getVerificationPresentation()).toBeUndefined();
  expect(() => workflow.verifyEmail('012345')).toThrow('unavailable');
  expect(api.verifyEmail).not.toHaveBeenCalled();
});
