import React from 'react';
import { act, renderHook, waitFor } from '@testing-library/react-native';
import { QueryClientProvider } from '@tanstack/react-query';
import { createQueryClient } from '@/lib/query/queryClient';
import { AuthenticationIntegrationProvider } from './AuthenticationIntegrationProvider';
import { authMutationKeys } from './authQueryPolicy';
import { createPasswordRecoveryWorkflow } from './passwordRecoveryWorkflow';
import { useResetPasswordController } from './usePasswordRecovery';

const token = `${'r'.repeat(42)}a`;

test('reset controller fails closed, suppresses duplicate pending submissions, and cleans up on success', async () => {
  let finishRequest: (() => void) | undefined;
  const confirmPasswordReset = jest.fn(
    () =>
      new Promise<void>((resolve) => {
        finishRequest = resolve;
      }),
  );
  const passwordRecovery = createPasswordRecoveryWorkflow({
    requestPasswordReset: jest.fn(),
    confirmPasswordReset,
  } as never);
  const sessionClear = jest.fn(async () => undefined);
  const onSuccess = jest.fn();
  const queryClient = createQueryClient();
  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>
      <AuthenticationIntegrationProvider
        capabilities={
          {
            passwordRecovery,
            session: { clear: sessionClear },
          } as never
        }
      >
        {children}
      </AuthenticationIntegrationProvider>
    </QueryClientProvider>
  );
  const { result } = renderHook(() => useResetPasswordController({ onSuccess }), { wrapper });

  await expect(result.current.submit({ newPassword: 'valid-password-value' })).resolves.toBe(false);
  expect(confirmPasswordReset).not.toHaveBeenCalled();

  expect(passwordRecovery.acceptToken(token)).toBe(true);
  let firstSubmission!: Promise<boolean>;
  let duplicateSubmission!: Promise<boolean>;
  act(() => {
    firstSubmission = result.current.submit({ newPassword: 'valid-password-value' });
    duplicateSubmission = result.current.submit({ newPassword: 'valid-password-value' });
  });
  await expect(duplicateSubmission).resolves.toBe(false);
  expect(confirmPasswordReset).toHaveBeenCalledTimes(1);
  expect(passwordRecovery.getState()).toBe('submitting');

  await act(async () => finishRequest?.());
  await expect(firstSubmission).resolves.toBe(true);
  await waitFor(() => expect(sessionClear).toHaveBeenCalledTimes(1));
  expect(onSuccess).toHaveBeenCalledTimes(1);
  expect(passwordRecovery.getState()).toBe('succeeded');
  expect(JSON.stringify(queryClient.getMutationCache().getAll())).not.toContain(token);
  expect(authMutationKeys.confirmPasswordReset).toEqual(['auth', 'confirm-password-reset']);
});
