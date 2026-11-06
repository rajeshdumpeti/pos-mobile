import { createCreationCoordinator } from './creation';
import { itemFixture } from './testFixtures';
import { ApiError } from '@/api';
import type { CreatePlanItem, PlanItem } from './types';
const payload: CreatePlanItem = {
  title: 'Draft item',
  scheduled_for_date: '2026-10-02',
  timezone: 'America/New_York',
  is_priority: false,
};
test('suppresses immediate duplicate submits and commits only confirmed result', async () => {
  const coordinator = createCreationCoordinator(() => 'fixed-key');
  let resolve!: (item: PlanItem) => void;
  const send = jest.fn(
    () =>
      new Promise<PlanItem>((done) => {
        resolve = done;
      }),
  );
  const first = coordinator.submit(payload, send),
    second = coordinator.submit(payload, send);
  expect(send).toHaveBeenCalledTimes(1);
  expect(await second).toBeUndefined();
  expect(coordinator.isBusy()).toBe(true);
  resolve(itemFixture());
  await expect(first).resolves.toEqual(itemFixture());
  expect(coordinator.getAttempt()).toBeUndefined();
});
test.each(['network', 'timeout', 'invalidResponse', 'cancelled'] as const)(
  'ambiguous %s keeps immutable key/payload for explicit retry',
  async (category) => {
    const factory = jest.fn(() => 'same-logical-key'),
      coordinator = createCreationCoordinator(factory);
    const send = jest
      .fn()
      .mockRejectedValueOnce(new ApiError(category, 'Unknown'))
      .mockResolvedValue(itemFixture());
    await expect(coordinator.submit(payload, send)).rejects.toBeInstanceOf(ApiError);
    expect(coordinator.needsReconciliation()).toBe(true);
    await expect(coordinator.submit({ ...payload, title: 'Changed' }, send)).rejects.toBeInstanceOf(
      ApiError,
    );
    expect(send).toHaveBeenCalledTimes(1);
    await coordinator.submit(payload, send);
    expect(send.mock.calls).toEqual([
      [payload, 'same-logical-key'],
      [payload, 'same-logical-key'],
    ]);
    expect(factory).toHaveBeenCalledTimes(1);
  },
);
test('idempotency conflict requires explicit review before starting a new key', async () => {
  const factory = jest.fn().mockReturnValueOnce('key-1').mockReturnValueOnce('key-2');
  const coordinator = createCreationCoordinator(factory),
    send = jest
      .fn()
      .mockRejectedValueOnce(
        new ApiError('http', 'Conflict', { status: 409, code: 'plan_item_idempotency_conflict' }),
      )
      .mockResolvedValue(itemFixture());
  await expect(coordinator.submit(payload, send)).rejects.toThrow();
  expect(coordinator.needsReconciliation()).toBe(true);
  coordinator.reset();
  await coordinator.submit({ ...payload, title: 'New reviewed intent' }, send);
  expect(send.mock.calls[1]?.[1]).toBe('key-2');
});
