import { createHttpClient, ApiError } from '@/api';
import { createInboxService } from './service';
import { pageSchema, validate, itemSchema } from './contracts';
import { badgeText, destination, nextCursor, uniqueItems, createTimezoneSync } from './state';
import { itemFixture, pageFixture, instant, notificationId } from './fixtures';
test('validates source scope and authoritative grouping without reclassifying old timestamps', () => {
  expect(validate(pageSchema, pageFixture()).items[0]?.group).toBe('earlier');
  expect(() => validate(pageSchema, pageFixture({ filter: 'today' }))).toThrow(ApiError);
  expect(() => validate(itemSchema, itemFixture({ is_read: true }))).toThrow(ApiError);
});
test('rejects arbitrary navigation, contradictory unavailable state and private extra fields', () => {
  for (const navigation of [
    {
      state: 'available',
      action: 'https://evil.test',
      selected_date: '2026-10-31',
      plan_item_id: null,
    },
    { state: 'unavailable', action: 'today.view', selected_date: null, plan_item_id: null },
  ])
    expect(() => validate(itemSchema, { ...itemFixture(), navigation })).toThrow(ApiError);
  expect(() => validate(itemSchema, { ...itemFixture(), account_id: 'foreign' })).toThrow(ApiError);
});
test('deduplicates in authoritative order, stops null cursor and repeated cursor loops', () => {
  const first = pageFixture({ next_cursor: 'opaque', has_more: true });
  expect(uniqueItems([first, pageFixture()])).toHaveLength(1);
  expect(nextCursor(first, [undefined])).toBe('opaque');
  expect(nextCursor(first, [undefined, 'opaque'])).toBeUndefined();
  expect(nextCursor(pageFixture(), [undefined])).toBeUndefined();
});
test.each([
  [0, undefined],
  [1, '1'],
  [99, '99'],
  [100, '99+'],
])('badge %s -> %s', (count, text) => expect(badgeText(Number(count))).toBe(text));
test('navigation preserves plan date and refuses historical Today redirection', () => {
  expect(destination(itemFixture(), 'UTC')).toMatchObject({ kind: 'plan', date: '2026-10-31' });
  const today = itemFixture({
    source: 'today',
    event_type: 'today.items_remaining',
    navigation: {
      state: 'available',
      action: 'today.view',
      selected_date: '2026-10-30',
      plan_item_id: null,
    },
  });
  expect(destination(today, 'UTC', new Date(instant))).toEqual({ kind: 'historicalToday' });
  expect(
    destination(
      { ...today, navigation: { ...today.navigation, selected_date: '2026-10-31' } },
      'UTC',
      new Date(instant),
    ),
  ).toEqual({ kind: 'today' });
  expect(
    destination(
      itemFixture({
        navigation: { state: 'unavailable', action: null, selected_date: null, plan_item_id: null },
      }),
      'UTC',
    ),
  ).toEqual({ kind: 'unavailable' });
});
test('timezone synchronization deduplicates in flight and confirmed values, retries failure and guards logout', async () => {
  const sync = createTimezoneSync(),
    send = jest.fn().mockResolvedValue({});
  await Promise.all([sync('UTC', send, () => true), sync('UTC', send, () => true)]);
  await sync('UTC', send, () => true);
  expect(send).toHaveBeenCalledTimes(1);
  send.mockRejectedValueOnce(new Error());
  await expect(sync('Europe/London', send, () => true)).rejects.toThrow();
  await sync('Europe/London', send, () => true);
  expect(send).toHaveBeenCalledTimes(3);
  await sync('America/New_York', send, () => false);
  expect(send).toHaveBeenCalledTimes(3);
});
test('shared authenticated transport supports exact Inbox endpoints and validates response scopes', async () => {
  const fetchImpl = jest.fn().mockResolvedValue({
    status: 200,
    headers: new Headers({ 'content-type': 'application/json' }),
    json: async () => pageFixture({ filter: 'plan' }),
  });
  const service = createInboxService(
    createHttpClient({ baseUrl: 'http://localhost:8000', fetchImpl }),
  );
  await service.list('test-access', 'plan', 'UTC', 'opaque');
  expect(fetchImpl).toHaveBeenCalledWith(
    'http://localhost:8000/api/v1/notifications?source=plan&timezone=UTC&limit=50&cursor=opaque',
    expect.objectContaining({
      headers: expect.objectContaining({ Authorization: 'Bearer test-access' }),
    }),
  );
  await expect(service.list('test-access', 'today', 'UTC')).rejects.toMatchObject({
    category: 'invalidResponse',
  });
  fetchImpl.mockResolvedValue({
    status: 200,
    headers: new Headers({ 'content-type': 'application/json' }),
    json: async () => ({
      contract_version: '1.0',
      source: 'plan',
      unread_count: 1,
      generated_at: instant,
    }),
  });
  await expect(service.count('test-access')).rejects.toMatchObject({ category: 'invalidResponse' });
  await expect(service.read('test-access', '../../bad')).rejects.toMatchObject({
    category: 'configuration',
  });
  expect(notificationId).toBeDefined();
});

test('PUT timezone and scoped read-all use validated bodies; read-one confirms its own identifier', async () => {
  const fetchImpl = jest.fn().mockResolvedValue({
    status: 200,
    headers: new Headers({ 'content-type': 'application/json' }),
    json: async () => ({
      contract_version: '1.0',
      timezone: 'UTC',
      updated_at: instant,
      version: 1,
    }),
  });
  const service = createInboxService(
    createHttpClient({ baseUrl: 'http://localhost:8000', fetchImpl }),
  );
  await service.timezone('test-access', 'UTC');
  expect(fetchImpl).toHaveBeenLastCalledWith(
    'http://localhost:8000/api/v1/account/timezone',
    expect.objectContaining({ method: 'PUT', body: JSON.stringify({ timezone: 'UTC' }) }),
  );
  fetchImpl.mockResolvedValue({
    status: 200,
    headers: new Headers({ 'content-type': 'application/json' }),
    json: async () => ({
      contract_version: '1.0',
      source: 'today',
      marked_read_count: 5,
      unread_count: 0,
      read_at: instant,
    }),
  });
  await service.readAll('test-access', 'today');
  expect(fetchImpl).toHaveBeenLastCalledWith(
    'http://localhost:8000/api/v1/notifications/read-all',
    expect.objectContaining({ method: 'POST', body: JSON.stringify({ source: 'today' }) }),
  );
  fetchImpl.mockResolvedValue({
    status: 200,
    headers: new Headers({ 'content-type': 'application/json' }),
    json: async () => ({
      contract_version: '1.0',
      source: 'all',
      notification_id: notificationId,
      is_read: true,
      read_at: instant,
      unread_count: 0,
    }),
  });
  await expect(service.read('test-access', notificationId)).resolves.toMatchObject({
    read_at: instant,
  });
  await expect(
    service.read('test-access', '33333333-3333-4333-8333-333333333333'),
  ).rejects.toMatchObject({ category: 'invalidResponse' });
});
