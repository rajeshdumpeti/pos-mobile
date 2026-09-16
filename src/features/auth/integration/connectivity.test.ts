import type { NetInfoState } from '@react-native-community/netinfo';
import { createConnectivityObserver } from './connectivity';

const native = (isConnected: boolean | null, isInternetReachable: boolean | null) =>
  ({ isConnected, isInternetReachable }) as NetInfoState;

test('connectivity remains unknown until both signals establish reachability', () => {
  let notify: ((state: NetInfoState) => void) | undefined;
  const remove = jest.fn();
  const observer = createConnectivityObserver({
    addEventListener: (listener) => {
      notify = listener;
      return remove;
    },
  });
  const listener = jest.fn();
  const unsubscribe = observer.subscribe(listener);
  expect(observer.getState()).toBe('unknown');
  notify?.(native(true, null));
  expect(observer.getState()).toBe('unknown');
  notify?.(native(false, null));
  expect(observer.getState()).toBe('offline');
  notify?.(native(true, true));
  expect(observer.getState()).toBe('online');
  expect(listener).toHaveBeenCalledTimes(2);
  unsubscribe();
  expect(remove).toHaveBeenCalledTimes(1);
});

test('one native subscription is shared and removed after the last listener', () => {
  const remove = jest.fn();
  const source = { addEventListener: jest.fn(() => remove) };
  const observer = createConnectivityObserver(source);
  const first = observer.subscribe(jest.fn());
  const second = observer.subscribe(jest.fn());
  expect(source.addEventListener).toHaveBeenCalledTimes(1);
  first();
  expect(remove).not.toHaveBeenCalled();
  second();
  expect(remove).toHaveBeenCalledTimes(1);
});
