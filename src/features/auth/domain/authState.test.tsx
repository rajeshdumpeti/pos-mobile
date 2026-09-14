import { act, renderHook } from '@testing-library/react-native';
import { mapAuthFailure, offlineAuthFailure } from './authFailure';
import { reduceAuthOperation } from './authOperation';
import { useAuthSubmissionIntent } from './useAuthSubmissionIntent';

test('operation reducer produces exclusive states without stale data', () => {
  const failure = offlineAuthFailure();
  expect(reduceAuthOperation({ status: 'idle' }, { type: 'submit' })).toEqual({
    status: 'submitting',
  });
  expect(reduceAuthOperation({ status: 'submitting' }, { type: 'fail', failure })).toEqual({
    status: 'failed',
    failure,
  });
  expect(
    reduceAuthOperation(
      { status: 'failed', failure },
      { type: 'succeed', data: { accountId: 'a' } },
    ),
  ).toEqual({ status: 'succeeded', data: { accountId: 'a' } });
  expect(reduceAuthOperation({ status: 'submitting' }, { type: 'reset' })).toEqual({
    status: 'idle',
  });
});
test('failure mapping retains validated diagnostics and drops raw or unsafe content', () => {
  expect(
    mapAuthFailure({
      code: 'rate_limited',
      request_id: 'req_1',
      retry_after_seconds: 30,
      message: 'secret',
    }),
  ).toEqual({
    kind: 'operation',
    category: 'rateLimited',
    message: 'Please wait before trying again.',
    code: 'rate_limited',
    requestId: 'req_1',
    retryAfterSeconds: 30,
  });
  expect(
    mapAuthFailure({
      code: 'unknown',
      request_id: '<script>',
      retry_after_seconds: 9999,
      password: 'secret',
    }),
  ).toEqual({
    kind: 'operation',
    category: 'unexpected',
    message: 'We could not complete that step.',
  });
});
test('submission intent suppresses rapid duplicate invocation', async () => {
  let release!: () => void;
  const pending = new Promise<void>((resolve) => {
    release = resolve;
  });
  const handler = jest.fn(() => pending);
  const { result } = renderHook(() => useAuthSubmissionIntent(handler));
  let first!: Promise<void | boolean | undefined>;
  await act(async () => {
    first = result.current({ email: 'a@b.co' });
    void result.current({ email: 'a@b.co' });
    await Promise.resolve();
  });
  expect(handler).toHaveBeenCalledTimes(1);
  release();
  await act(async () => first);
});
