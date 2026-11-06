import React from 'react';
import { render, waitFor } from '@testing-library/react-native';
import * as Linking from 'expo-linking';
import { useRouter } from 'expo-router';
import { useAuthenticationCapabilities } from './AuthenticationIntegrationProvider';
import { PasswordResetLinkIngress } from './PasswordResetLinkIngress';

jest.mock('expo-linking', () => ({ getInitialURL: jest.fn(), addEventListener: jest.fn() }));
jest.mock('expo-router', () => ({ useRouter: jest.fn() }));
jest.mock('./AuthenticationIntegrationProvider', () => ({
  useAuthenticationCapabilities: jest.fn(),
}));

const candidate = `${'c'.repeat(42)}z`;
const acceptToken = jest.fn(() => true);
const replace = jest.fn();
let warmHandler: ((event: { url: string }) => void) | undefined;

beforeEach(() => {
  jest.clearAllMocks();
  (useRouter as jest.Mock).mockReturnValue({ replace });
  (useAuthenticationCapabilities as jest.Mock).mockReturnValue({
    passwordRecovery: { acceptToken },
  });
  (Linking.addEventListener as jest.Mock).mockImplementation((_type, handler) => {
    warmHandler = handler;
    return { remove: jest.fn() };
  });
});

test('cold-start ingestion transfers once and replaces with a token-free route', async () => {
  (Linking.getInitialURL as jest.Mock).mockResolvedValue(`pos://reset-password?token=${candidate}`);
  render(<PasswordResetLinkIngress />);
  await waitFor(() => expect(acceptToken).toHaveBeenCalledWith(candidate));
  expect(replace).toHaveBeenCalledWith('/(auth)/reset-password');
  expect(JSON.stringify(replace.mock.calls)).not.toContain(candidate);
});

test('warm-state ingestion uses the same centralized boundary', async () => {
  (Linking.getInitialURL as jest.Mock).mockResolvedValue(null);
  render(<PasswordResetLinkIngress />);
  await waitFor(() =>
    expect(Linking.addEventListener).toHaveBeenCalledWith('url', expect.any(Function)),
  );
  warmHandler?.({ url: `pos://reset-password?token=${candidate}` });
  expect(acceptToken).toHaveBeenCalledWith(candidate);
  expect(replace).toHaveBeenCalledWith('/(auth)/reset-password');
});

test('malformed or unrelated links do not enter reset custody or navigation', async () => {
  (Linking.getInitialURL as jest.Mock).mockResolvedValue('pos://reset-password?token=short');
  render(<PasswordResetLinkIngress />);
  await waitFor(() => expect(Linking.getInitialURL).toHaveBeenCalled());
  await Promise.resolve();
  expect(acceptToken).not.toHaveBeenCalled();
  expect(replace).not.toHaveBeenCalled();
});
