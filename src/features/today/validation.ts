import { z } from 'zod';
import { ApiError } from '@/api';
import type { TodayResource, PlanItem } from './types';
import { isTimeZone } from './time';
const date = z.iso.date();
const instant = z.iso.datetime({ offset: true });
const uuid = z.uuid();
const count = z.number().int().nonnegative();
const zone = z.string().max(128).refine(isTimeZone);
const action = z.enum([
  'plan_item.create',
  'plan_item.view',
  'plan_item.update',
  'plan_item.complete',
]);
const state = z.enum(['available', 'empty', 'no_data', 'unavailable', 'partial', 'stale', 'error']);
const completion = z.enum(['incomplete', 'completed']);
const domain = z.literal('plan_item');
const priority = z.enum(['health', 'nutrition', 'fitness', 'focus', 'money', 'habits', 'sleep']);
const goal = z.enum([
  'target_weight',
  'daily_protein_grams',
  'daily_water',
  'daily_calories_kcal',
  'daily_steps',
  'workouts_per_week',
  'focus_minutes_per_day',
  'target_sleep_minutes',
  'budget_target',
]);
const recommendation = z.enum([
  'priority_past_start',
  'past_start',
  'priority_upcoming',
  'upcoming',
  'priority_unscheduled',
  'unscheduled',
  'create_first_plan_item',
  'all_plan_items_complete',
]);
const summary = z.strictObject({
  plan_item_id: uuid,
  title: z.string().min(1).max(200),
  scheduled_start_at: instant.nullable(),
  scheduled_end_at: instant.nullable(),
  scheduled_for_date: date,
  timezone: zone,
  domain,
  state: completion,
  action,
  completed_at: instant.nullable(),
});
const itemSection = z.strictObject({ state, items: z.array(summary).max(3), action });
export const planItemSchema: z.ZodType<PlanItem> = z
  .strictObject({
    id: uuid,
    title: z.string().min(1).max(200),
    scheduled_for_date: date,
    timezone: zone,
    scheduled_start_at: instant.nullable(),
    scheduled_end_at: instant.nullable(),
    is_priority: z.boolean(),
    completed_at: instant.nullable(),
    created_at: instant,
    updated_at: instant,
    version: z.number().int().min(1),
  })
  .superRefine((item, ctx) => {
    if (
      !item.title.trim() ||
      (item.completed_at && item.is_priority) ||
      (item.scheduled_end_at &&
        (!item.scheduled_start_at ||
          Date.parse(item.scheduled_end_at) <= Date.parse(item.scheduled_start_at)))
    )
      ctx.addIssue({ code: 'custom', message: 'Invalid item facts' });
  });
export const todaySchema: z.ZodType<TodayResource> = z
  .strictObject({
    contract_version: z.literal('1.0'),
    generated_at: instant,
    timezone: zone,
    local_date: date,
    freshness: z.strictObject({ state: z.literal('current'), as_of: instant }),
    daily_status: z.strictObject({
      state,
      code: z.enum(['getting_started', 'complete', 'needs_attention', 'on_track']),
      eligible: count,
      completed: count,
      remaining: count,
      overdue: count,
    }),
    next_best_action: z.strictObject({
      state: z.enum(['populated', 'new_user', 'insufficient_data']),
      code: recommendation,
      domain,
      recommendation: z.string(),
      reason: z.string(),
      action,
      plan_item_id: uuid.nullable(),
      evidence: z.strictObject({
        eligible: count,
        remaining: count,
        is_priority: z.boolean().nullable(),
        scheduled_start_at: instant.nullable(),
      }),
    }),
    score: z.strictObject({
      state: z.enum(['available', 'no_score']),
      percentage: z.number().int().min(0).max(100).nullable(),
      numerator: count,
      denominator: count,
      breakdown: z.array(
        z.strictObject({
          item_id: uuid,
          domain,
          eligibility_reason: z.literal('assigned_current_local_date'),
          weight: z.literal(1),
          earned_weight: z.union([z.literal(0), z.literal(1)]),
          completion_state: completion,
        }),
      ),
    }),
    progress: z.strictObject({
      state,
      reason: z.literal('no_supported_measurement_sources'),
      metrics: z.array(z.literal('reserved')).max(0),
    }),
    up_next: z.strictObject({
      state,
      items: z
        .array(z.strictObject({ item: summary, label: z.enum(['NOW', 'NEXT', 'LATER']) }))
        .max(4),
      action,
    }),
    top_priorities: itemSection,
    wins: itemSection,
    capabilities: z.strictObject({
      state,
      actions: z.array(action),
      priority_life_areas: z.array(priority),
      configured_goals: z.array(goal),
      measurement_sources: z.array(z.literal('reserved')).max(0),
    }),
  })
  .superRefine((value, ctx) => {
    const score = value.score,
      ids = new Set(score.breakdown.map((item) => item.item_id));
    const expected =
      score.denominator === 0
        ? null
        : Math.floor((score.numerator * 100) / score.denominator + 0.5);
    if (
      ids.size !== score.breakdown.length ||
      score.denominator !== score.breakdown.length ||
      score.numerator !== score.breakdown.reduce((sum, item) => sum + item.earned_weight, 0) ||
      score.percentage !== expected ||
      score.state !== (score.denominator === 0 ? 'no_score' : 'available') ||
      value.daily_status.eligible !== score.denominator ||
      value.daily_status.completed !== score.numerator ||
      value.daily_status.remaining !== score.denominator - score.numerator ||
      value.daily_status.overdue > value.daily_status.remaining ||
      score.breakdown.some(
        (item) => (item.completion_state === 'completed') !== (item.earned_weight === 1),
      ) ||
      (value.next_best_action.state === 'populated' && !value.next_best_action.plan_item_id)
    )
      ctx.addIssue({ code: 'custom', message: 'Inconsistent dashboard facts' });
  });
function validate<T>(schema: z.ZodType<T>, value: unknown): T {
  const result = schema.safeParse(value);
  if (!result.success) throw new ApiError('invalidResponse', 'The planning response is invalid.');
  return result.data;
}
export const requireToday = (value: unknown): TodayResource => validate(todaySchema, value);
export const requirePlanItem = (value: unknown): PlanItem => validate(planItemSchema, value);
