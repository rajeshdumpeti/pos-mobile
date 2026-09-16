import NetInfo, { type NetInfoState } from '@react-native-community/netinfo';

export type ConnectivityState = 'unknown' | 'online' | 'offline';
export type ConnectivitySource = {
  addEventListener(listener: (state: NetInfoState) => void): () => void;
};

function safeState(
  value: Pick<NetInfoState, 'isConnected' | 'isInternetReachable'>,
): ConnectivityState {
  if (value.isConnected === false || value.isInternetReachable === false) return 'offline';
  if (value.isConnected === true && value.isInternetReachable === true) return 'online';
  return 'unknown';
}

export function createConnectivityObserver(source: ConnectivitySource = NetInfo) {
  let state: ConnectivityState = 'unknown';
  let unsubscribe: (() => void) | undefined;
  const listeners = new Set<() => void>();
  const update = (native: NetInfoState) => {
    const next = safeState(native);
    if (next === state) return;
    state = next;
    listeners.forEach((listener) => listener());
  };
  return {
    getState: () => state,
    subscribe: (listener: () => void) => {
      listeners.add(listener);
      if (listeners.size === 1) unsubscribe = source.addEventListener(update);
      return () => {
        listeners.delete(listener);
        if (listeners.size === 0) {
          unsubscribe?.();
          unsubscribe = undefined;
        }
      };
    },
  };
}

export type ConnectivityObserver = ReturnType<typeof createConnectivityObserver>;
