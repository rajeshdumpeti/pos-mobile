import type { PlanDateResource, PlanDayItem } from './validation';
import { itemFixture } from '@/features/today/testFixtures';
export function dayItem(overrides: Partial<PlanDayItem> = {}): PlanDayItem {
  return {
    ...itemFixture({ is_priority: false }),
    section: 'unscheduled_incomplete',
    timing_state: 'unscheduled',
    action: 'plan_item.view',
    ...overrides,
  };
}
export function planFixture(day = '2026-10-02', items: PlanDayItem[] = []): PlanDateResource {
  return {
    contract_version: '1.0',
    generated_at: '2026-10-02T14:00:00Z',
    timezone: 'America/New_York',
    selected_date: day,
    date_relation: 'current',
    freshness: { state: 'current', as_of: '2026-10-02T14:00:00Z' },
    summary: {
      total: items.length,
      completed: 0,
      remaining: items.length,
      scheduled_remaining: 0,
      unscheduled_remaining: items.length,
      completion_percentage: items.length ? 0 : null,
    },
    insight: {
      state: 'empty',
      code: 'selected_date_empty',
      recommendation: 'Create a plan item',
      reason: 'No items are currently assigned to this date.',
      action: 'plan_item.create',
      plan_item_id: null,
      evidence: {
        selected_date: day,
        date_relation: 'current',
        total: items.length,
        completed: 0,
        remaining: items.length,
        is_priority: null,
        timing_state: null,
        scheduled_start_at: null,
      },
    },
    items: items.map((item) => ({ ...item, scheduled_for_date: day })),
    page: { limit: 50, next_cursor: null, has_more: false },
  };
}
