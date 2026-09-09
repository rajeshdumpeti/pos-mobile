import * as SecureStore from 'expo-secure-store';
import {
  createSecureCredentialStorage,
  REFRESH_CREDENTIAL_KEY,
  SECURE_STORE_OPTIONS,
} from './secureCredentialStorage';
import { createCredentialVault } from './credentialVault';
function driver(initial: string | null = null) {
  let value = initial;
  return {
    isAvailableAsync: jest.fn(async () => true),
    getItemAsync: jest.fn(async () => value),
    setItemAsync: jest.fn(async (_k: string, v: string) => {
      value = v;
    }),
    deleteItemAsync: jest.fn(async () => {
      value = null;
    }),
  };
}
test('uses one namespaced key and strongest device-only non-biometric options', async () => {
  const d = driver();
  const storage = createSecureCredentialStorage(d as never, 'ios');
  await storage.write('refresh-token');
  expect(d.setItemAsync).toHaveBeenCalledWith(
    REFRESH_CREDENTIAL_KEY,
    JSON.stringify({ version: 1, refreshCredential: 'refresh-token' }),
    SECURE_STORE_OPTIONS,
  );
  expect(SECURE_STORE_OPTIONS).toEqual({
    keychainAccessible: SecureStore.WHEN_UNLOCKED_THIS_DEVICE_ONLY,
    requireAuthentication: false,
  });
  expect(await storage.read()).toEqual({
    ok: true,
    status: 'available',
    refreshCredential: 'refresh-token',
  });
  expect(d.getItemAsync).toHaveBeenCalledWith(REFRESH_CREDENTIAL_KEY, SECURE_STORE_OPTIONS);
  await expect(storage.delete()).resolves.toEqual({ ok: true });
  expect(d.deleteItemAsync).toHaveBeenCalledWith(REFRESH_CREDENTIAL_KEY, SECURE_STORE_OPTIONS);
});
test('validates the complete serialized envelope against the UTF-8 storage bound', async () => {
  const d = driver();
  const storage = createSecureCredentialStorage(d as never, 'ios');
  expect(await storage.write('é'.repeat(1024))).toEqual({ ok: false, reason: 'malformed' });
  expect(d.setItemAsync).not.toHaveBeenCalled();
  expect(
    await createSecureCredentialStorage(
      driver(JSON.stringify({ version: 1, refreshCredential: 'é'.repeat(1024) })) as never,
      'ios',
    ).read(),
  ).toEqual({ ok: false, reason: 'malformed' });
});
test('fails closed for missing, unsupported, malformed and storage failures', async () => {
  expect(await createSecureCredentialStorage(driver() as never, 'ios').read()).toEqual({
    ok: true,
    status: 'missing',
  });
  expect(await createSecureCredentialStorage(driver() as never, 'web').read()).toEqual({
    ok: false,
    reason: 'unsupported',
  });
  for (const raw of [
    '{}',
    JSON.stringify({ version: 2, refreshCredential: 'x' }),
    JSON.stringify({ version: 1, refreshCredential: 'bad\nvalue' }),
    JSON.stringify({ version: 1, refreshCredential: 'x'.repeat(2049) }),
  ])
    expect(await createSecureCredentialStorage(driver(raw) as never, 'ios').read()).toEqual({
      ok: false,
      reason: 'malformed',
    });
  const d = driver();
  d.getItemAsync.mockRejectedValueOnce(new Error('secret'));
  d.setItemAsync.mockRejectedValueOnce(new Error('secret'));
  d.deleteItemAsync.mockRejectedValueOnce(new Error('secret'));
  const storage = createSecureCredentialStorage(d as never, 'ios');
  expect(await storage.read()).toEqual({ ok: false, reason: 'readFailed' });
  expect(await storage.write('secret-token')).toEqual({ ok: false, reason: 'writeFailed' });
  expect(await storage.delete()).toEqual({ ok: false, reason: 'deleteFailed' });
  expect(JSON.stringify(await storage.write('bad token'))).not.toContain('bad token');
});
test('vault persists refresh before exposing access and clears memory first', async () => {
  const events: string[] = [];
  const storage = {
    read: jest.fn(async () => ({ ok: true, status: 'missing' }) as const),
    write: jest.fn(async () => {
      events.push('write');
      return { ok: true } as const;
    }),
    delete: jest.fn(async () => {
      events.push('delete');
      return { ok: false, reason: 'deleteFailed' } as const;
    }),
  };
  const vault = createCredentialVault(storage);
  expect(vault.getAccessCredential()).toBeUndefined();
  await vault.commit({ accessCredential: 'access-token', refreshCredential: 'refresh-token' });
  expect(events).toEqual(['write']);
  expect(vault.getAccessCredential()).toBe('access-token');
  expect(await vault.clear()).toEqual({ ok: false, reason: 'deleteFailed' });
  expect(vault.getAccessCredential()).toBeUndefined();
  expect(Object.keys(vault)).not.toContain('refreshCredential');
});
test('failed commit or rotation leaves no usable access credential', async () => {
  const storage = {
    read: jest.fn(),
    write: jest.fn(async () => ({ ok: false, reason: 'writeFailed' }) as const),
    delete: jest.fn(),
  };
  const vault = createCredentialVault(storage);
  expect(
    await vault.commit({ accessCredential: 'candidate', refreshCredential: 'refresh' }),
  ).toEqual({ ok: false, reason: 'writeFailed' });
  expect(vault.getAccessCredential()).toBeUndefined();
});
