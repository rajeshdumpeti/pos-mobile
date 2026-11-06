import { requireToday, requirePlanItem } from './validation';
import { todayFixture, itemFixture, itemId } from './testFixtures';
import { destinationForAction, visibleActions } from './actions';
import { serializeDraft, draftFromItem } from './draft';
import { boundaryMarker, localDate, timestampMatchesZone, timestampInZone } from './time';
import { mapPlanningFailure } from './failure';
import { ApiError } from '@/api';
test('strict empty/null and legitimate zero remain distinct; goals are not measurements', () => {
  const empty = requireToday(todayFixture());
  expect(empty.score.percentage).toBeNull();
  expect(empty.progress.metrics).toEqual([]);
  const zero = todayFixture();
  zero.score = {
    state: 'available',
    percentage: 0,
    numerator: 0,
    denominator: 1,
    breakdown: [
      {
        item_id: itemId,
        domain: 'plan_item',
        eligibility_reason: 'assigned_current_local_date',
        weight: 1,
        earned_weight: 0,
        completion_state: 'incomplete',
      },
    ],
  };
  zero.daily_status.eligible = 1;
  zero.daily_status.remaining = 1;
  expect(requireToday(zero).score.percentage).toBe(0);
  expect(() => requireToday({ ...zero, raw: 'unexpected-private-field' })).toThrow(ApiError);
  expect(() => requireToday({ ...zero, score: { ...zero.score, percentage: 50 } })).toThrow(
    ApiError,
  );
  expect(() => requirePlanItem({ ...itemFixture(), version: 0 })).toThrow(ApiError);
});
test('only supported capabilities and explicit destination mappings are active', () => {
  expect(
    visibleActions([
      'nutrition.log',
      'plan_item.create',
      'plan_item.view',
      'plan_item.complete',
      'water.log',
    ]),
  ).toEqual(['plan_item.create', 'plan_item.view', 'plan_item.complete']);
  expect(destinationForAction('plan_item.create')).toEqual({ kind: 'create' });
  expect(destinationForAction('plan_item.view', itemId)).toEqual({ kind: 'detail', id: itemId });
  expect(destinationForAction('plan_item.update', itemId)).toEqual({ kind: 'edit', id: itemId });
  expect(destinationForAction('plan_item.complete', itemId)).toEqual({
    kind: 'complete',
    id: itemId,
  });
  expect(destinationForAction('plan_item.view')).toBeUndefined();
});
test.each([
  ['2026-03-08T02:30:00-05:00', false],
  ['2026-03-08T03:30:00-04:00', true],
  ['2026-11-01T01:30:00-04:00', true],
  ['2026-11-01T01:30:00-05:00', true],
  ['2026-10-02T10:00:00-05:00', false],
  ['2026-10-02T10:00:00', false],
])('explicit offset validation handles DST gaps/folds: %s', (value, valid) => {
  expect(timestampMatchesZone(value, 'America/New_York')).toBe(valid);
});
test('intent validation and schedule clearing preserve the contract', () => {
  const draft = draftFromItem(itemFixture());
  expect(serializeDraft(draft).payload?.scheduled_start_at).toBeNull();
  expect(serializeDraft({ ...draft, title: ' ', timezone: '-04:00' }).errors).toEqual(
    expect.objectContaining({ title: expect.any(String), timezone: expect.any(String) }),
  );
  expect(
    serializeDraft({
      ...draft,
      scheduled: true,
      start: '2026-10-02T10:00:00-04:00',
      end: '2026-10-02T10:00:00-04:00',
    }).errors?.end,
  ).toBeDefined();
  expect(
    serializeDraft({
      ...draft,
      date: '2026-10-03',
      scheduled: true,
      start: '2026-10-02T10:00:00-04:00',
    }).errors?.start,
  ).toBeDefined();
});
test('UTC/local midnight and zone changes update markers without a client today query date', () => {
  const before = new Date('2026-10-03T03:59:00Z'),
    after = new Date('2026-10-03T04:00:00Z');
  expect(localDate(before, 'America/New_York')).toBe('2026-10-02');
  expect(localDate(after, 'America/New_York')).toBe('2026-10-03');
  expect(boundaryMarker(before, 'Asia/Tokyo')).not.toEqual(
    boundaryMarker(before, 'America/New_York'),
  );
  expect(timestampInZone('2026-11-01T06:30:00Z', 'America/New_York')).toBe(
    '2026-11-01T01:30:00-05:00',
  );
});
test('safe errors never render raw backend prose or private fields', () => {
  const failure = mapPlanningFailure(
    new ApiError('http', 'Private backend prose', {
      status: 409,
      code: 'plan_item_state_conflict',
      requestId: 'safe-id',
      fields: [{ field: 'title', message: 'Private title' }],
    }),
  );
  expect(failure.kind).toBe('conflict');
  expect(failure.requestId).toBe('safe-id');
  expect(JSON.stringify(failure)).not.toContain('Private');
});
