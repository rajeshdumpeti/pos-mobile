import {
  isOpaqueCredential,
  type CredentialPair,
  type CredentialReadResult,
  type CredentialResult,
} from './credentialTypes';
import type { RefreshCredentialStorage } from './secureCredentialStorage';
export interface CredentialVault {
  commit(pair: CredentialPair): Promise<CredentialResult>;
  rotate(pair: CredentialPair): Promise<CredentialResult>;
  getAccessCredential(): string | undefined;
  readRefreshForValidation(): Promise<CredentialReadResult>;
  hasRefreshCredential(): Promise<boolean>;
  clear(): Promise<CredentialResult>;
  resetForTests(): void;
}
export function createCredentialVault(storage: RefreshCredentialStorage): CredentialVault {
  let access: string | undefined;
  const commit = async (pair: CredentialPair) => {
    if (!isOpaqueCredential(pair.accessCredential) || !isOpaqueCredential(pair.refreshCredential)) {
      access = undefined;
      return { ok: false, reason: 'malformed' } as const;
    }
    const result = await storage.write(pair.refreshCredential);
    if (!result.ok) {
      access = undefined;
      return result;
    }
    access = pair.accessCredential;
    return { ok: true } as const;
  };
  return {
    commit,
    rotate: commit,
    getAccessCredential: () => access,
    readRefreshForValidation: () => storage.read(),
    async hasRefreshCredential() {
      const result = await storage.read();
      return result.ok && result.status === 'available';
    },
    async clear() {
      access = undefined;
      return storage.delete();
    },
    resetForTests() {
      access = undefined;
    },
  };
}
