import { useEffect, useState, useSyncExternalStore } from 'react';
import { AppState } from 'react-native';
import { createPermissionController, type PermissionAdapter } from './controller';

export function usePermission(adapter: PermissionAdapter) {
  const [controller] = useState(() => createPermissionController(adapter));
  const state = useSyncExternalStore(controller.subscribe, controller.getSnapshot);
  useEffect(() => {
    controller.start();
    let previous = AppState.currentState;
    const subscription = AppState.addEventListener('change', (next) => {
      const returning = previous !== 'active' && next === 'active';
      previous = next;
      if (returning) void controller.check();
    });
    return () => {
      controller.stop();
      subscription.remove();
    };
  }, [controller]);
  return { state, controller };
}
