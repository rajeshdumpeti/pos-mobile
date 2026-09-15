import { createAuthenticationService } from './authenticationService';
test('uses exact contract operations and does not add confirmation fields', async () => {
  const calls: Array<Record<string, unknown>> = [];
  const request = async <R, B = never>(input: import('../client').HttpRequest<B>): Promise<R> => {
    calls.push(input as unknown as Record<string, unknown>);
    return {} as R;
  };
  const service = createAuthenticationService(request);
  await service.getRegistrationPolicy();
  await service.register({
    display_name: 'A',
    email: 'a@example.test',
    password: 'secret-password',
    terms_accepted: true,
    privacy_accepted: true,
    terms_version: '1',
    privacy_version: '1',
  });
  await service.verifyEmail({ flow_token: 'flow', code: '012345' });
  await service.resendVerification({ flow_token: 'flow' });
  await service.changeUnverifiedEmail({ flow_token: 'flow', new_email: 'b@example.test' });
  await service.signIn({ email: 'a@example.test', password: 'secret-password' });
  await service.refresh({ refresh_token: 'refresh' }, 'idem-1');
  await service.getCurrentSession('access');
  await service.signOut('access');
  await service.signOutAll('access');
  await service.requestPasswordReset({ email: 'a@example.test' });
  await service.confirmPasswordReset({ token: 'reset', new_password: 'new-password-value' });
  expect(calls.map((x) => [x.method, x.path, x.expectedStatuses])).toEqual([
    ['GET', '/api/v1/auth/registration-policy', [200]],
    ['POST', '/api/v1/auth/registrations', [202]],
    ['POST', '/api/v1/auth/email-verifications/confirm', [201]],
    ['POST', '/api/v1/auth/email-verifications/resend', [202]],
    ['PATCH', '/api/v1/auth/email-verifications/email', [202]],
    ['POST', '/api/v1/auth/sessions', [200, 403]],
    ['POST', '/api/v1/auth/sessions/refresh', [200]],
    ['GET', '/api/v1/auth/session', [200]],
    ['DELETE', '/api/v1/auth/session', [204]],
    ['DELETE', '/api/v1/auth/sessions', [204]],
    ['POST', '/api/v1/auth/password-resets', [202]],
    ['POST', '/api/v1/auth/password-resets/confirm', [204]],
  ]);
  expect(JSON.stringify(calls)).not.toContain('confirmPassword');
});
