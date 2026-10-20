import { adjacentDate, planContext } from './calendar';
import { mergePlanPages, requirePlanDate } from './validation';
import { dayItem, planFixture } from './testFixtures';
import { createPlanningService } from '@/features/today/service';
import { createHttpClient } from '@/api';
test.each([
  ['2026-03-08', 1, '2026-03-09'],
  ['2026-11-01', -1, '2026-10-31'],
  ['2028-02-28', 1, '2028-02-29'],
  ['2026-12-31', 1, '2027-01-01'],
] as const)('calendar navigation %s across DST/leap/year boundary', (date, direction, expected) => {
  expect(adjacentDate(date, direction)).toBe(expected);
});
test('route context accepts only a valid date and known origin', () => {
  expect(planContext('plan', '2026-02-30')).toBeUndefined();
  expect(planContext('plan', ['2026-10-02'])).toBeUndefined();
  expect(planContext('today', '2026-10-02')).toBeUndefined();
  expect(planContext('plan', '2026-10-02')).toEqual({ origin: 'plan', selectedDate: '2026-10-02' });
});
test('null/zero and insight unavailability preserve authoritative counts/items', () => {
  const empty = planFixture();
  expect(
    requirePlanDate(empty, empty.selected_date, empty.timezone).summary.completion_percentage,
  ).toBeNull();
  const data = planFixture(undefined, [dayItem()]);
  data.insight = {
    ...data.insight,
    state: 'unavailable',
    code: 'insight_unavailable',
    action: null,
  };
  expect(
    requirePlanDate(data, data.selected_date, data.timezone).summary.completion_percentage,
  ).toBe(0);
  expect(requirePlanDate(data, data.selected_date, data.timezone).items).toHaveLength(1);
  expect(() => requirePlanDate(data, '2026-10-03', data.timezone)).toThrow('could not be verified');
  expect(() =>
    requirePlanDate({ ...data, account_id: 'foreign' }, data.selected_date, data.timezone),
  ).toThrow();
});
test('dedup preserves backend page and section order without reranking', () => {
  const first = dayItem({
      is_priority: false,
      section: 'scheduled_incomplete',
      timing_state: 'past',
      scheduled_start_at: '2026-10-02T13:00:00Z',
    }),
    second = dayItem({ id: '00000000-0000-4000-8000-000000000022', is_priority: true });
  expect(
    mergePlanPages([planFixture(undefined, [first]), planFixture(undefined, [first, second])]).map(
      (i) => i.id,
    ),
  ).toEqual([first.id, second.id]);
});
test('transport encodes opaque selected-date queries through bearer client', async () => {
  const data = planFixture();
  const fetcher = jest.fn(
    async (_input: RequestInfo | URL, _init?: RequestInit) =>
      new Response(JSON.stringify(data), {
        status: 200,
        headers: { 'content-type': 'application/json' },
      }),
  );
  const service = createPlanningService(
    createHttpClient({ baseUrl: 'https://api.example.test', fetchImpl: fetcher }),
  );
  await service.selectedDate('synthetic-access', data.selected_date, data.timezone, 'opaque+/=');
  expect(fetcher.mock.calls[0]).toEqual(
    expect.arrayContaining([expect.stringContaining('cursor=opaque%2B%2F%3D')]),
  );
  expect(fetcher.mock.calls[0]?.[1]).toMatchObject({
    headers: expect.objectContaining({ Authorization: 'Bearer synthetic-access' }),
  });
});
