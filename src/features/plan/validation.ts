import { z } from 'zod';
import { ApiError } from '@/api';
import type { components } from '@/api/generated/schema';
import { isTimeZone } from '@/features/today/time';
export type PlanDateResource = components['schemas']['PlanSelectedDateResponse'];
export type PlanDayItem = components['schemas']['PlanDayItemResponse'];
const instant = z.iso.datetime({ offset: true }),
  date = z.iso.date(),
  count = z.number().int().nonnegative();
const relation = z.enum(['past', 'current', 'future']);
const timing = z.enum(['ongoing', 'past', 'upcoming', 'unscheduled', 'completed']);
const zone = z.string().refine(isTimeZone);
const item = z.strictObject({
  id: z.uuid(),
  title: z.string().min(1).max(200),
  scheduled_for_date: date,
  timezone: zone,
  scheduled_start_at: instant.nullable(),
  scheduled_end_at: instant.nullable(),
  is_priority: z.boolean(),
  completed_at: instant.nullable(),
  created_at: instant,
  updated_at: instant,
  version: z.number().int().positive(),
  section: z.enum(['scheduled_incomplete', 'unscheduled_incomplete', 'completed']),
  timing_state: timing,
  action: z.literal('plan_item.view'),
});
const code = z.enum([
  'current_ongoing_priority',
  'current_ongoing',
  'current_past_priority',
  'current_past',
  'current_upcoming_priority',
  'current_upcoming',
  'current_unscheduled_priority',
  'current_unscheduled',
  'past_remaining_priority',
  'past_remaining',
  'future_scheduled_priority',
  'future_scheduled',
  'future_unscheduled_priority',
  'future_unscheduled',
  'selected_date_complete',
  'selected_date_empty',
  'insight_unavailable',
]);
const schema: z.ZodType<PlanDateResource> = z
  .strictObject({
    contract_version: z.literal('1.0'),
    generated_at: instant,
    timezone: zone,
    selected_date: date,
    date_relation: relation,
    freshness: z.strictObject({ state: z.literal('current'), as_of: instant }),
    summary: z.strictObject({
      total: count,
      completed: count,
      remaining: count,
      scheduled_remaining: count,
      unscheduled_remaining: count,
      completion_percentage: z.number().int().min(0).max(100).nullable(),
    }),
    insight: z.strictObject({
      state: z.enum(['available', 'empty', 'unavailable', 'error']),
      code,
      recommendation: z.string(),
      reason: z.string(),
      action: z.enum(['plan_item.create', 'plan_item.view']).nullable(),
      plan_item_id: z.uuid().nullable(),
      evidence: z.strictObject({
        selected_date: date,
        date_relation: relation,
        total: count,
        completed: count,
        remaining: count,
        is_priority: z.boolean().nullable(),
        timing_state: timing.nullable(),
        scheduled_start_at: instant.nullable(),
      }),
    }),
    items: z.array(item).max(100),
    page: z.strictObject({
      limit: z.number().int().min(1).max(100),
      next_cursor: z.string().min(1).max(1024).nullable(),
      has_more: z.boolean(),
    }),
  })
  .superRefine((value, ctx) => {
    const s = value.summary;
    if (
      s.completed + s.remaining !== s.total ||
      s.scheduled_remaining + s.unscheduled_remaining !== s.remaining ||
      (s.total === 0) !== (s.completion_percentage === null) ||
      value.generated_at !== value.freshness.as_of ||
      value.page.has_more !== (value.page.next_cursor !== null) ||
      value.items.length > value.page.limit ||
      value.items.some(
        (i) =>
          i.scheduled_for_date !== value.selected_date ||
          (i.completed_at !== null) !== (i.section === 'completed') ||
          (i.completed_at !== null) !== (i.timing_state === 'completed') ||
          (i.section === 'scheduled_incomplete' && !i.scheduled_start_at) ||
          (i.section === 'unscheduled_incomplete' && i.scheduled_start_at),
      )
    )
      ctx.addIssue({ code: 'custom', message: 'Inconsistent selected-date facts' });
  });
export function requirePlanDate(
  value: unknown,
  selectedDate: string,
  timezone: string,
): PlanDateResource {
  const result = schema.safeParse(value);
  if (
    !result.success ||
    result.data.selected_date !== selectedDate ||
    result.data.timezone !== timezone
  )
    throw new ApiError('invalidResponse', 'The Plan response could not be verified.');
  return result.data;
}
export function mergePlanPages(pages: readonly PlanDateResource[]): PlanDayItem[] {
  const seen = new Set<string>();
  return pages.flatMap((page) =>
    page.items.filter((item) => {
      if (seen.has(item.id)) return false;
      seen.add(item.id);
      return true;
    }),
  );
}
