import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';
import {
  isOpaqueCredential,
  type CredentialReadResult,
  type CredentialResult,
} from './credentialTypes';
export const REFRESH_CREDENTIAL_KEY = 'com.pos.auth.refresh.v1';
export const SECURE_STORE_OPTIONS = {
  keychainAccessible: SecureStore.WHEN_UNLOCKED_THIS_DEVICE_ONLY,
  requireAuthentication: false,
} as const;
export const SECURE_STORE_VALUE_MAX_BYTES = 2048;
export function utf8ByteLength(value: string) {
  let bytes = 0;
  for (const character of value) {
    const point = character.codePointAt(0) ?? 0;
    bytes += point <= 0x7f ? 1 : point <= 0x7ff ? 2 : point <= 0xffff ? 3 : 4;
  }
  return bytes;
}
type Driver = Pick<
  typeof SecureStore,
  'isAvailableAsync' | 'getItemAsync' | 'setItemAsync' | 'deleteItemAsync'
>;
export interface RefreshCredentialStorage {
  read(): Promise<CredentialReadResult>;
  write(value: string): Promise<CredentialResult>;
  delete(): Promise<CredentialResult>;
}
export function createSecureCredentialStorage(
  driver: Driver = SecureStore,
  platform: string = Platform.OS,
): RefreshCredentialStorage {
  const available = async () => {
    if (platform === 'web') return false;
    try {
      return await driver.isAvailableAsync();
    } catch {
      return false;
    }
  };
  return {
    async read() {
      if (!(await available())) return { ok: false, reason: 'unsupported' };
      let raw: string | null;
      try {
        raw = await driver.getItemAsync(REFRESH_CREDENTIAL_KEY, SECURE_STORE_OPTIONS);
      } catch {
        return { ok: false, reason: 'readFailed' };
      }
      if (raw === null) return { ok: true, status: 'missing' };
      if (typeof raw !== 'string') return { ok: false, reason: 'malformed' };
      if (utf8ByteLength(raw) > SECURE_STORE_VALUE_MAX_BYTES)
        return { ok: false, reason: 'malformed' };
      try {
        const value = JSON.parse(raw) as unknown;
        if (!value || typeof value !== 'object') return { ok: false, reason: 'malformed' };
        const envelope = value as Record<string, unknown>;
        if (envelope.version !== 1 || !isOpaqueCredential(envelope.refreshCredential))
          return { ok: false, reason: 'malformed' };
        return { ok: true, status: 'available', refreshCredential: envelope.refreshCredential };
      } catch {
        return { ok: false, reason: 'malformed' };
      }
    },
    async write(value) {
      if (!isOpaqueCredential(value)) return { ok: false, reason: 'malformed' };
      const serialized = JSON.stringify({ version: 1, refreshCredential: value });
      if (utf8ByteLength(serialized) > SECURE_STORE_VALUE_MAX_BYTES)
        return { ok: false, reason: 'malformed' };
      if (!(await available())) return { ok: false, reason: 'unsupported' };
      try {
        await driver.setItemAsync(REFRESH_CREDENTIAL_KEY, serialized, SECURE_STORE_OPTIONS);
        return { ok: true };
      } catch {
        return { ok: false, reason: 'writeFailed' };
      }
    },
    async delete() {
      if (!(await available())) return { ok: false, reason: 'unsupported' };
      try {
        await driver.deleteItemAsync(REFRESH_CREDENTIAL_KEY, SECURE_STORE_OPTIONS);
        return { ok: true };
      } catch {
        return { ok: false, reason: 'deleteFailed' };
      }
    },
  };
}
