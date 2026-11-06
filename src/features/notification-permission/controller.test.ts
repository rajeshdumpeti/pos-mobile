import { createPermissionController, type Permission, type PermissionAdapter } from './controller';
const requestable: Permission = { authorization: 'notDetermined', canAskAgain: true };
const granted: Permission = { authorization: 'authorized', canAskAgain: false };
function setup(permission = requestable) {
  const adapter = {
    check: jest.fn().mockResolvedValue(permission),
    request: jest.fn().mockResolvedValue(granted),
    openSettings: jest.fn().mockResolvedValue(undefined),
  } satisfies PermissionAdapter;
  const controller = createPermissionController(adapter);
  return { adapter, controller };
}
const settle = async () => {
  for (let i = 0; i < 8; i++) await Promise.resolve();
};
test('starting and foreground checks never request, and stopping discards late checks', async () => {
  const { adapter, controller } = setup();
  let finish!: (permission: Permission) => void;
  adapter.check.mockImplementationOnce(
    () =>
      new Promise((resolve) => {
        finish = resolve;
      }),
  );
  const listener = jest.fn();
  controller.subscribe(listener);
  controller.start();
  expect(adapter.request).not.toHaveBeenCalled();
  controller.stop();
  const count = listener.mock.calls.length;
  finish(granted);
  await settle();
  expect(listener).toHaveBeenCalledTimes(count);
  await controller.check();
  await controller.enable();
  expect(adapter.check).toHaveBeenCalledTimes(1);
  expect(adapter.request).not.toHaveBeenCalled();
});
test('only explicit enable requests and synchronous repeated taps cannot duplicate a prompt', async () => {
  const { adapter, controller } = setup();
  controller.start();
  await settle();
  let finish!: (permission: Permission) => void;
  adapter.request.mockImplementationOnce(
    () =>
      new Promise((resolve) => {
        finish = resolve;
      }),
  );
  const first = controller.enable();
  const second = controller.enable();
  await settle();
  expect(adapter.request).toHaveBeenCalledTimes(1);
  expect(controller.getSnapshot().phase).toBe('requesting');
  finish(granted);
  await Promise.all([first, second]);
  expect(controller.getSnapshot()).toEqual({ phase: 'ready', permission: granted });
});
test('already authorized and externally authorized do not prompt again', async () => {
  const { adapter, controller } = setup();
  controller.start();
  await settle();
  adapter.check.mockResolvedValue(granted);
  await controller.enable();
  expect(adapter.request).not.toHaveBeenCalled();
  expect(controller.getSnapshot().permission).toEqual(granted);
});
test.each(['denied', 'provisional', 'ephemeral', 'unsupported'] as const)(
  '%s without request-again never triggers another prompt',
  async (authorization) => {
    const { adapter, controller } = setup({ authorization, canAskAgain: false });
    controller.start();
    await settle();
    await controller.enable();
    expect(adapter.request).not.toHaveBeenCalled();
    expect(controller.getSnapshot().permission?.authorization).toBe(authorization);
  },
);
test('requestable denial permits an explicit later retry', async () => {
  const { adapter, controller } = setup({ authorization: 'denied', canAskAgain: true });
  controller.start();
  await settle();
  await controller.enable();
  expect(adapter.request).toHaveBeenCalledTimes(1);
});
test.each(['check', 'request', 'settings'] as const)(
  '%s failures are safe and retryable',
  async (kind) => {
    const { adapter, controller } = setup();
    controller.start();
    await settle();
    const method = kind === 'settings' ? adapter.openSettings : adapter[kind];
    method.mockRejectedValueOnce(new Error('private native error'));
    await (kind === 'settings'
      ? controller.settings()
      : kind === 'request'
        ? controller.enable()
        : controller.check());
    expect(controller.getSnapshot().failure).toBe(kind);
    expect(JSON.stringify(controller.getSnapshot())).not.toContain('private');
    await controller.check();
    expect(controller.getSnapshot().phase).toBe('ready');
  },
);
test('settings does not imply permission and a resume check reads the OS again', async () => {
  const denied: Permission = { authorization: 'denied', canAskAgain: false };
  const { adapter, controller } = setup(denied);
  controller.start();
  await settle();
  await controller.settings();
  expect(controller.getSnapshot().permission).toEqual(denied);
  adapter.check.mockResolvedValue(granted);
  await controller.check();
  expect(controller.getSnapshot().permission).toEqual(granted);
  expect(adapter.request).not.toHaveBeenCalled();
});
test('a resume during a native request queues only a status check', async () => {
  const { adapter, controller } = setup();
  controller.start();
  await settle();
  let finish!: (permission: Permission) => void;
  adapter.request.mockImplementationOnce(
    () =>
      new Promise((resolve) => {
        finish = resolve;
      }),
  );
  const pending = controller.enable();
  await settle();
  await controller.check();
  adapter.check.mockResolvedValue(granted);
  finish(granted);
  await pending;
  await settle();
  expect(adapter.check).toHaveBeenCalledTimes(3);
  expect(adapter.request).toHaveBeenCalledTimes(1);
});
test('late request result after dismissal cannot update or reopen the experience', async () => {
  const { adapter, controller } = setup();
  controller.start();
  await settle();
  let finish!: (permission: Permission) => void;
  adapter.request.mockImplementationOnce(
    () =>
      new Promise((resolve) => {
        finish = resolve;
      }),
  );
  const pending = controller.enable();
  await settle();
  controller.stop();
  const state = controller.getSnapshot();
  finish(granted);
  await pending;
  await controller.check();
  expect(controller.getSnapshot()).toBe(state);
});
