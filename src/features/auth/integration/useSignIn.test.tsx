import React from 'react';
import { act, renderHook, waitFor } from '@testing-library/react-native';
import { QueryClientProvider } from '@tanstack/react-query';
import { createQueryClient } from '@/lib/query/queryClient';
import { AuthenticationIntegrationProvider } from './AuthenticationIntegrationProvider';
import { useSignInController } from './useSignIn';

test('authenticated route unmount does not clear the newly established session', async () => {
  let finish: ((value: { kind: 'authenticated' }) => void) | undefined;
  const session = {
    getState: () => ({ status: 'signedOut' as const }),
    subscribe: () => () => undefined,
    initialize: jest.fn(async () => undefined),
    signIn: jest.fn(
      () => new Promise<{ kind: 'authenticated' }>((resolve) => void (finish = resolve)),
    ),
    refresh: jest.fn(),
    logout: jest.fn(),
    clear: jest.fn(async () => undefined),
  };
  const queryClient = createQueryClient();
  const wrapper = ({ children }: React.PropsWithChildren) => (
    <QueryClientProvider client={queryClient}>
      <AuthenticationIntegrationProvider
        capabilities={{
          inspectBootstrap: jest.fn(),
          clearCredentials: jest.fn(),
          registration: { clear: jest.fn() } as never,
          session,
          passwordRecovery: {
            request: jest.fn(),
            acceptToken: jest.fn(() => true),
            confirm: jest.fn(),
            finishTerminalFailure: jest.fn(),
            clear: jest.fn(),
            getState: () => 'missing',
            subscribe: () => () => undefined,
          },
        }}
      >
        {children}
      </AuthenticationIntegrationProvider>
    </QueryClientProvider>
  );
  const authenticated = jest.fn();
  const hook = renderHook(
    () =>
      useSignInController({
        onAuthenticated: authenticated,
        onVerificationRequired: jest.fn(),
      }),
    { wrapper },
  );

  let submission: Promise<boolean> | undefined;
  act(() => {
    submission = hook.result.current.submit({
      email: 'person@example.test',
      password: 'user-entered-value',
    });
  });
  await waitFor(() => expect(session.signIn).toHaveBeenCalledTimes(1));
  hook.unmount();
  await act(async () => finish?.({ kind: 'authenticated' }));

  await expect(submission).resolves.toBe(false);
  expect(session.clear).not.toHaveBeenCalled();
  expect(authenticated).not.toHaveBeenCalled();
});
