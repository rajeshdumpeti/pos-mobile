export type CredentialPair = { accessCredential: string; refreshCredential: string };
export type CredentialFailure = {
  ok: false;
  reason: 'unsupported' | 'readFailed' | 'writeFailed' | 'deleteFailed' | 'malformed';
};
export type CredentialReadResult =
  | { ok: true; status: 'missing' }
  | { ok: true; status: 'available'; refreshCredential: string }
  | CredentialFailure;
export type CredentialResult = { ok: true } | CredentialFailure;
export function isOpaqueCredential(value: unknown): value is string {
  if (typeof value !== 'string' || value.length < 1 || value.length > 2048 || /\s/.test(value))
    return false;
  return !Array.from(value).some((character) => {
    const code = character.charCodeAt(0);
    return code < 32 || code === 127;
  });
}
