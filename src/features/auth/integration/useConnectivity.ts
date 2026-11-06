import { useSyncExternalStore } from 'react';
import { useAuthenticationCapabilities } from './AuthenticationIntegrationProvider';
import type { ConnectivityState } from './connectivity';

export function useAuthenticationConnectivity(): ConnectivityState {
  const { connectivity } = useAuthenticationCapabilities();
  return useSyncExternalStore(connectivity.subscribe, connectivity.getState, connectivity.getState);
}
