import React, { createContext, useContext, useState } from 'react';
import { appConfig } from '@/config/env';
import { createHttpClient, createAuthenticationService } from '@/api';
import {
  createCredentialVault,
  createSecureCredentialStorage,
  type CredentialVault,
} from './credentials';
import { inspectSessionBootstrap, type SessionBootstrapResult } from './sessionBootstrap';
export type AuthenticationCapabilities = {
  inspectBootstrap(): Promise<SessionBootstrapResult>;
  clearCredentials(): ReturnType<CredentialVault['clear']>;
};
function createDependencies(): AuthenticationCapabilities {
  const vault = createCredentialVault(createSecureCredentialStorage());
  createAuthenticationService(createHttpClient({ baseUrl: appConfig.apiUrl }));
  return {
    inspectBootstrap: () => inspectSessionBootstrap(vault),
    clearCredentials: () => vault.clear(),
  };
}
const Context = createContext<AuthenticationCapabilities | undefined>(undefined);
export function AuthenticationIntegrationProvider({
  children,
  capabilities,
}: {
  children: React.ReactNode;
  capabilities?: AuthenticationCapabilities;
}) {
  const [dependencies] = useState(createDependencies);
  return <Context.Provider value={capabilities ?? dependencies}>{children}</Context.Provider>;
}
export function useAuthenticationCapabilities() {
  const value = useContext(Context);
  if (!value) throw new Error('Authentication integration is unavailable.');
  return value;
}
