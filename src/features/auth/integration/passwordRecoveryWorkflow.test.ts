import { ApiError } from '@/api';
import { createPasswordRecoveryWorkflow } from './passwordRecoveryWorkflow';
import { parsePasswordResetLink } from './passwordResetLink';

const opaque = (suffix = 'a') => `${'r'.repeat(42)}${suffix}`;

function service() {
  return {
    requestPasswordReset: jest.fn(async () => ({ status: 'instructions_if_eligible' as const })),
    confirmPasswordReset: jest.fn(async () => undefined),
  };
}

test('neutral request submits the exact typed email without retaining it', async () => {
  const api = service();
  const workflow = createPasswordRecoveryWorkflow(api as never);
  await workflow.request('person@example.test');
  expect(api.requestPasswordReset).toHaveBeenCalledTimes(1);
  expect(api.requestPasswordReset).toHaveBeenCalledWith({ email: 'person@example.test' });
  expect(workflow.getState()).toBe('missing');
  expect(JSON.stringify(workflow)).not.toContain('person@example.test');
});

test('confirmation owns the token privately and sends only authorized fields', async () => {
  const api = service();
  const workflow = createPasswordRecoveryWorkflow(api as never);
  const candidate = opaque(' ');
  expect(workflow.acceptToken(candidate)).toBe(true);
  expect(JSON.stringify(workflow)).not.toContain(candidate);
  await workflow.confirm('a sufficiently long password');
  expect(api.confirmPasswordReset).toHaveBeenCalledWith({
    token: candidate,
    new_password: 'a sufficiently long password',
  });
  expect(workflow.getState()).toBe('succeeded');
  await expect(workflow.confirm('another valid password')).rejects.toThrow(
    'Password reset context is unavailable.',
  );
});

test('duplicate delivery is idempotent and retryable failures preserve continuation', async () => {
  const api = service();
  api.confirmPasswordReset.mockRejectedValueOnce(new ApiError('network', 'safe transport failure'));
  const workflow = createPasswordRecoveryWorkflow(api as never);
  const candidate = opaque();
  expect(workflow.acceptToken(candidate)).toBe(true);
  expect(workflow.acceptToken(candidate)).toBe(true);
  await expect(workflow.confirm('a sufficiently long password')).rejects.toBeInstanceOf(ApiError);
  expect(workflow.getState()).toBe('ready');
  await workflow.confirm('a sufficiently long password');
  expect(api.confirmPasswordReset).toHaveBeenCalledTimes(2);
});

test.each([
  ['unexpected scheme', `other://reset-password?token=${opaque()}`],
  ['unexpected host', `pos://lookalike?token=${opaque()}`],
  ['unexpected path', `pos://reset-password/extra?token=${opaque()}`],
  ['credentials', `pos://user:pass@reset-password?token=${opaque()}`],
  ['fragment', `pos://reset-password?token=${opaque()}#fragment`],
  ['missing token', 'pos://reset-password'],
  ['empty token', 'pos://reset-password?token='],
  ['duplicate token', `pos://reset-password?token=${opaque()}&token=${opaque('b')}`],
  ['extra parameter', `pos://reset-password?token=${opaque()}&next=internal`],
  ['overlong token', `pos://reset-password?token=${'x'.repeat(129)}`],
] as const)('rejects %s without exposing a continuation', (_case, url) => {
  expect(parsePasswordResetLink(url)).toEqual({ accepted: false });
});

test('accepts only the exact configured development shape and preserves token text', () => {
  const candidate = opaque('+');
  const received = new URL(`pos://reset-password?token=${candidate}`);
  expect(received).toMatchObject({
    protocol: 'pos:',
    hostname: 'reset-password',
    pathname: '',
  });
  expect(parsePasswordResetLink(`pos://reset-password?token=${candidate}`)).toEqual({
    accepted: true,
    token: candidate,
  });
});

test('invalid and expired terminal outcomes erase the active continuation', async () => {
  const workflow = createPasswordRecoveryWorkflow(service() as never);
  workflow.acceptToken(opaque());
  workflow.finishTerminalFailure('invalid');
  expect(workflow.getState()).toBe('invalid');
  await expect(workflow.confirm('a sufficiently long password')).rejects.toThrow(
    'Password reset context is unavailable.',
  );
  workflow.acceptToken(opaque('b'));
  workflow.finishTerminalFailure('expired');
  expect(workflow.getState()).toBe('expired');
});
