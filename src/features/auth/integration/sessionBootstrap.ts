import type { CredentialVault } from './credentials';
export type SessionBootstrapResult = {
  status: 'signedOut';
  reason:
    | 'noCredential'
    | 'storageUnavailable'
    | 'storageFailure'
    | 'malformedCredential'
    | 'requiresValidation';
};
export async function inspectSessionBootstrap(
  vault: CredentialVault,
): Promise<SessionBootstrapResult> {
  const result = await vault.readRefreshForValidation();
  if (!result.ok)
    return {
      status: 'signedOut',
      reason:
        result.reason === 'unsupported'
          ? 'storageUnavailable'
          : result.reason === 'malformed'
            ? 'malformedCredential'
            : 'storageFailure',
    };
  if (result.status === 'missing') return { status: 'signedOut', reason: 'noCredential' };
  return { status: 'signedOut', reason: 'requiresValidation' };
}
