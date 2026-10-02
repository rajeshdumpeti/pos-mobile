import { ApiError } from '@/api';
import { createSessionWorkflow } from './sessionWorkflow';

const tokenResponse = () => ({
  access_token: 'opaque-access-value',
  refresh_token: 'opaque-refresh-value',
  token_type: 'Bearer' as const,
  access_expires_at: '2026-09-14T12:10:00Z',
  refresh_expires_at: '2026-09-21T12:00:00Z',
  account_id: '00000000-0000-4000-8000-000000000001',
  session_id: '00000000-0000-4000-8000-000000000002',
  onboarding_required: true,
});

function setup(stored = false) {
  let refresh = stored ? 'stored-refresh-value' : undefined;
  let access: string | undefined;
  const vault = {
    commit: jest.fn(async (pair) => {
      access = pair.accessCredential;
      refresh = pair.refreshCredential;
      return { ok: true as const };
    }),
    rotate: jest.fn(async (pair) => {
      access = pair.accessCredential;
      refresh = pair.refreshCredential;
      return { ok: true as const };
    }),
    getAccessCredential: () => access,
    readRefreshForValidation: jest.fn(async () =>
      refresh
        ? ({ ok: true, status: 'available', refreshCredential: refresh } as const)
        : ({ ok: true, status: 'missing' } as const),
    ),
    clear: jest.fn(async () => {
      access = undefined;
      refresh = undefined;
      return { ok: true as const };
    }),
  };
  const service = {
    signIn: jest.fn(async () => tokenResponse()),
    refresh: jest.fn(async () => tokenResponse()),
    getCurrentSession: jest.fn(async () => ({
      account_id: tokenResponse().account_id,
      session_id: tokenResponse().session_id,
      display_name: 'POS Tester',
      onboarding_required: true,
    })),
    signOut: jest.fn(async () => undefined),
    signOutAll: jest.fn(async () => undefined),
  };
  const registration = {
    replaceVerificationContinuation: jest.fn(),
    clear: jest.fn(),
  };
  return {
    workflow: createSessionWorkflow(service as never, vault as never, registration as never),
    service,
    vault,
    registration,
  };
}

test('verified sign-in commits secure credentials and publishes a token-free session', async () => {
  const { workflow, service, vault } = setup();
  await expect(workflow.signIn('person@example.test', 'user-entered-value')).resolves.toEqual({
    kind: 'authenticated',
  });
  expect(service.signIn).toHaveBeenCalledTimes(1);
  expect(vault.commit).toHaveBeenCalledTimes(1);
  expect(workflow.getState()).toEqual({
    status: 'signedIn',
    account: { accountId: tokenResponse().account_id, onboardingRequired: true },
  });
  expect(JSON.stringify(workflow.getState())).not.toMatch(/access|refresh|password/i);
});

test('secure-storage failure clears partial session state and fails closed', async () => {
  const { workflow, vault } = setup();
  vault.commit.mockResolvedValueOnce({ ok: false, reason: 'writeFailed' } as never);
  await expect(workflow.signIn('person@example.test', 'user-entered-value')).rejects.toThrow(
    'Secure session storage is unavailable.',
  );
  expect(vault.clear).toHaveBeenCalled();
  expect(workflow.getState()).toEqual({ status: 'signedOut' });
});

test('unverified sign-in transfers only the continuation to transient registration state', async () => {
  const { workflow, service, registration, vault } = setup();
  service.signIn.mockResolvedValueOnce({
    code: 'email_not_verified',
    message: 'Email verification is required',
    request_id: 'safe-request',
    actions: ['verify_email'],
    verification_flow: {
      flow_token: 'opaque-flow-value',
      masked_email: 'p***@example.test',
      expires_at: '2026-09-14T12:30:00Z',
      resend_available_at: '2026-09-14T12:01:00Z',
    },
  } as never);
  await expect(workflow.signIn('person@example.test', 'user-entered-value')).resolves.toEqual({
    kind: 'verificationRequired',
  });
  expect(registration.replaceVerificationContinuation).toHaveBeenCalledTimes(1);
  expect(vault.commit).not.toHaveBeenCalled();
});

test('restoration and concurrent refresh use one rotation then current-session lookup', async () => {
  const { workflow, service } = setup(true);
  const first = workflow.initialize();
  const second = workflow.initialize();
  expect(first).toBe(second);
  await first;
  expect(service.refresh).toHaveBeenCalledTimes(1);
  expect(service.getCurrentSession).toHaveBeenCalledTimes(1);
  expect(workflow.getState().status).toBe('signedIn');
});

test('completed-account cold restoration publishes current authoritative shell eligibility', async () => {
  const { workflow, service } = setup(true);
  service.getCurrentSession.mockResolvedValueOnce({
    account_id: tokenResponse().account_id,
    session_id: tokenResponse().session_id,
    display_name: 'POS Tester',
    onboarding_required: false,
  });
  await workflow.initialize();
  expect(workflow.getState()).toEqual({
    status: 'signedIn',
    account: {
      accountId: tokenResponse().account_id,
      displayName: 'POS Tester',
      onboardingRequired: false,
    },
  });
});

test('stale restoration cannot overwrite a newer authenticated session', async () => {
  const { workflow, service, vault } = setup(true);
  let finishRead:
    ((value: Awaited<ReturnType<typeof vault.readRefreshForValidation>>) => void) | undefined;
  vault.readRefreshForValidation.mockImplementationOnce(
    () => new Promise((resolve) => void (finishRead = resolve)),
  );

  const restoration = workflow.initialize();
  await workflow.signIn('person@example.test', 'user-entered-value');
  finishRead?.({ ok: true, status: 'available', refreshCredential: 'stale-refresh-value' });
  await restoration;

  expect(service.refresh).not.toHaveBeenCalled();
  expect(vault.clear).not.toHaveBeenCalled();
  expect(workflow.getState()).toEqual({
    status: 'signedIn',
    account: { accountId: tokenResponse().account_id, onboardingRequired: true },
  });
});

test('terminal refresh clears credentials while a network failure preserves them signed out', async () => {
  const terminal = setup(true);
  terminal.service.refresh.mockRejectedValueOnce(
    new ApiError('http', 'safe', { code: 'refresh_session_expired' }),
  );
  await expect(terminal.workflow.refresh()).rejects.toBeInstanceOf(ApiError);
  expect(terminal.vault.clear).toHaveBeenCalled();

  const recoverable = setup(true);
  recoverable.service.refresh.mockRejectedValueOnce(new ApiError('network', 'safe'));
  await expect(recoverable.workflow.refresh()).rejects.toBeInstanceOf(ApiError);
  expect(recoverable.vault.clear).not.toHaveBeenCalled();
  expect(recoverable.workflow.getState()).toEqual({ status: 'signedOut' });
});

test('ambiguous refresh retry reuses the same credential and idempotency key', async () => {
  const { workflow, service } = setup(true);
  service.refresh.mockRejectedValueOnce(new ApiError('network', 'safe'));
  await expect(workflow.refresh()).rejects.toBeInstanceOf(ApiError);
  await expect(workflow.refresh()).resolves.toBe(true);
  expect(service.refresh).toHaveBeenCalledTimes(2);
  expect(service.refresh.mock.calls[1]).toEqual(service.refresh.mock.calls[0]);
});

test('offline restoration preserves credentials and explicit retry reuses the refresh attempt', async () => {
  const { workflow, service, vault } = setup(true);
  service.refresh.mockRejectedValueOnce(new ApiError('network', 'safe'));
  await workflow.initialize();
  expect(workflow.getState()).toEqual({ status: 'restorationFailed', reason: 'offline' });
  expect(vault.clear).not.toHaveBeenCalled();
  await workflow.retryRestoration();
  expect(workflow.getState().status).toBe('signedIn');
  expect(service.refresh.mock.calls[1]).toEqual(service.refresh.mock.calls[0]);
});

test('logout clears locally even when the backend is unavailable', async () => {
  const { workflow, service, vault, registration } = setup();
  await workflow.signIn('person@example.test', 'user-entered-value');
  service.signOut.mockRejectedValueOnce(new ApiError('network', 'safe'));
  await expect(workflow.logout()).resolves.toBeUndefined();
  expect(vault.clear).toHaveBeenCalled();
  expect(registration.clear).toHaveBeenCalled();
  expect(workflow.getState()).toEqual({ status: 'signedOut' });
});

test('logout makes local state inaccessible before remote revocation finishes', async () => {
  const { workflow, service } = setup();
  await workflow.signIn('person@example.test', 'user-entered-value');
  let finish: ((value: undefined) => void) | undefined;
  service.signOut.mockImplementationOnce(
    () => new Promise<undefined>((resolve) => void (finish = resolve)),
  );
  const logout = workflow.logout();
  for (let turn = 0; turn < 5 && !finish; turn += 1) await Promise.resolve();
  expect(workflow.getState()).toEqual({ status: 'signedOut' });
  finish?.(undefined);
  await logout;
});

test('all-session logout reports remote confirmation without restoring local state', async () => {
  const confirmed = setup();
  await confirmed.workflow.signIn('person@example.test', 'user-entered-value');
  await expect(confirmed.workflow.logoutAll()).resolves.toBe(true);
  expect(confirmed.workflow.getState()).toEqual({ status: 'signedOut' });

  const unconfirmed = setup();
  await unconfirmed.workflow.signIn('person@example.test', 'user-entered-value');
  unconfirmed.service.signOutAll.mockRejectedValueOnce(new ApiError('network', 'safe'));
  await expect(unconfirmed.workflow.logoutAll()).resolves.toBe(false);
  expect(unconfirmed.workflow.getState()).toEqual({ status: 'signedOut' });
});
