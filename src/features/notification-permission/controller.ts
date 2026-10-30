export type Authorization =
  'notDetermined' | 'denied' | 'authorized' | 'provisional' | 'ephemeral' | 'unsupported';
export type Permission = { authorization: Authorization; canAskAgain: boolean };
export type PermissionAdapter = {
  check: () => Promise<Permission>;
  request: () => Promise<Permission>;
  openSettings: () => Promise<void>;
};
export type PermissionState = {
  phase: 'checking' | 'ready' | 'requesting' | 'openingSettings' | 'error';
  permission?: Permission;
  failure?: 'check' | 'request' | 'settings';
};

/** One mounted experience. Native prompts cannot be cancelled; their late results can be ignored. */
export function createPermissionController(adapter: PermissionAdapter) {
  let state: PermissionState = { phase: 'checking' };
  let active = false;
  let generation = 0;
  let busy = false;
  let recheck = false;
  const listeners = new Set<() => void>();
  const publish = (next: PermissionState) => {
    state = next;
    listeners.forEach((listener) => listener());
  };
  const run = async (kind: 'check' | 'request' | 'settings') => {
    if (!active) return;
    if (busy) {
      if (kind === 'check') recheck = true;
      return;
    }
    busy = true;
    const operation = generation;
    const current = () => active && operation === generation;
    publish({
      phase: kind === 'check' ? 'checking' : kind === 'request' ? 'requesting' : 'openingSettings',
      permission: state.permission,
    });
    try {
      if (kind === 'settings') {
        await adapter.openSettings();
        if (current()) publish({ phase: 'ready', permission: state.permission });
      } else {
        // Always re-read before requesting: permission may have changed outside POS.
        let permission = await adapter.check();
        if (!current()) return;
        if (
          kind === 'request' &&
          permission.authorization !== 'authorized' &&
          permission.authorization !== 'unsupported' &&
          permission.canAskAgain
        ) {
          permission = await adapter.request();
        }
        if (current()) publish({ phase: 'ready', permission });
      }
    } catch {
      if (current()) publish({ phase: 'error', permission: state.permission, failure: kind });
    } finally {
      if (current()) {
        busy = false;
        if (recheck) {
          recheck = false;
          void run('check');
        }
      }
    }
  };
  return {
    getSnapshot: () => state,
    subscribe: (listener: () => void) => {
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    },
    start: () => {
      active = true;
      generation += 1;
      busy = false;
      recheck = false;
      void run('check');
    },
    stop: () => {
      active = false;
      generation += 1;
      recheck = false;
    },
    check: () => run('check'),
    enable: () => run('request'),
    settings: () => run('settings'),
  };
}
