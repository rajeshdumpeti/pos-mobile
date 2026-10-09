// Synthetic test fixtures only; no runtime import or fallback data.
import type { TodayResource, PlanItem } from './types';
export const accountA = '10000000-0000-4000-8000-000000000001';
export const accountB = '10000000-0000-4000-8000-000000000002';
export const itemId = '20000000-0000-4000-8000-000000000001';
export function itemFixture(overrides: Partial<PlanItem> = {}): PlanItem {
  return {
    id: itemId,
    title: 'Prepare priorities',
    scheduled_for_date: '2026-10-02',
    timezone: 'America/New_York',
    scheduled_start_at: null,
    scheduled_end_at: null,
    is_priority: true,
    completed_at: null,
    created_at: '2026-10-02T14:00:00Z',
    updated_at: '2026-10-02T14:00:00Z',
    version: 1,
    ...overrides,
  };
}
export function todayFixture(): TodayResource {
  return {
    contract_version: '1.0',
    generated_at: '2026-10-02T14:00:00Z',
    timezone: 'America/New_York',
    local_date: '2026-10-02',
    freshness: { state: 'current', as_of: '2026-10-02T14:00:00Z' },
    daily_status: {
      state: 'available',
      code: 'getting_started',
      eligible: 0,
      completed: 0,
      remaining: 0,
      overdue: 0,
    },
    next_best_action: {
      state: 'new_user',
      code: 'create_first_plan_item',
      domain: 'plan_item',
      recommendation: 'Create a plan item',
      reason: 'No incomplete eligible plan items',
      action: 'plan_item.create',
      plan_item_id: null,
      evidence: { eligible: 0, remaining: 0, is_priority: null, scheduled_start_at: null },
    },
    score: { state: 'no_score', percentage: null, numerator: 0, denominator: 0, breakdown: [] },
    progress: { state: 'unavailable', reason: 'no_supported_measurement_sources', metrics: [] },
    up_next: { state: 'empty', items: [], action: 'plan_item.create' },
    top_priorities: { state: 'empty', items: [], action: 'plan_item.create' },
    wins: { state: 'empty', items: [], action: 'plan_item.create' },
    capabilities: {
      state: 'partial',
      actions: ['plan_item.create', 'plan_item.view', 'plan_item.update', 'plan_item.complete'],
      priority_life_areas: ['focus'],
      configured_goals: ['daily_steps'],
      measurement_sources: [],
    },
  };
}
