import { z } from 'zod';
import type { CreatePlanItem, PlanItem } from './types';
import { isTimeZone, localDate, timestampInZone, timestampMatchesZone } from './time';
export type PlanDraft = {
  title: string;
  date: string;
  timezone: string;
  scheduled: boolean;
  start: string;
  end: string;
  priority: boolean;
};
export type DraftErrors = Partial<Record<keyof PlanDraft, string>>;
const fieldCopy: Record<keyof PlanDraft, string> = {
  title: 'Add a title (up to 200 characters).',
  date: 'Choose a valid date.',
  timezone: 'Your timezone is unavailable. Check your device settings.',
  scheduled: 'Check the schedule.',
  start: 'Choose a start time that exists on this date.',
  end: 'Choose an end time later than the start.',
  priority: 'Choose whether this is a priority.',
};
const schema = z
  .object({
    title: z.string().trim().min(1).max(200),
    date: z.iso.date(),
    timezone: z.string().refine(isTimeZone),
    scheduled: z.boolean(),
    start: z.string(),
    end: z.string(),
    priority: z.boolean(),
  })
  .superRefine((draft, ctx) => {
    if (!draft.scheduled) return;
    if (
      !timestampMatchesZone(draft.start, draft.timezone) ||
      draft.start.slice(0, 10) !== draft.date
    )
      ctx.addIssue({ code: 'custom', path: ['start'], message: 'Invalid start' });
    if (
      draft.end &&
      (!timestampMatchesZone(draft.end, draft.timezone) ||
        Date.parse(draft.end) <= Date.parse(draft.start))
    )
      ctx.addIssue({ code: 'custom', path: ['end'], message: 'Invalid end' });
  });
export function serializeDraft(
  draft: PlanDraft,
): { payload: CreatePlanItem; errors?: never } | { errors: DraftErrors; payload?: never } {
  const result = schema.safeParse(draft);
  if (!result.success) {
    const errors: DraftErrors = {};
    for (const issue of result.error.issues) {
      const key = issue.path[0];
      if (typeof key === 'string' && key in fieldCopy)
        errors[key as keyof PlanDraft] = fieldCopy[key as keyof PlanDraft];
    }
    return { errors };
  }
  const data = result.data;
  return {
    payload: {
      title: data.title,
      scheduled_for_date: data.date,
      timezone: data.timezone,
      scheduled_start_at: data.scheduled ? data.start : null,
      scheduled_end_at: data.scheduled && data.end ? data.end : null,
      is_priority: data.priority,
    },
  };
}
export function emptyDraft(zone: string | undefined): PlanDraft {
  return {
    title: '',
    date: zone ? localDate(new Date(), zone) : '',
    timezone: zone ?? '',
    scheduled: false,
    start: '',
    end: '',
    priority: false,
  };
}
export function draftFromItem(item: PlanItem): PlanDraft {
  return {
    title: item.title,
    date: item.scheduled_for_date,
    timezone: item.timezone,
    scheduled: item.scheduled_start_at !== null,
    start: item.scheduled_start_at ? timestampInZone(item.scheduled_start_at, item.timezone) : '',
    end: item.scheduled_end_at ? timestampInZone(item.scheduled_end_at, item.timezone) : '',
    priority: item.is_priority,
  };
}
export function draftFromCreation(item: Readonly<CreatePlanItem>): PlanDraft {
  return {
    title: item.title,
    date: item.scheduled_for_date,
    timezone: item.timezone,
    scheduled: Boolean(item.scheduled_start_at),
    start: item.scheduled_start_at ?? '',
    end: item.scheduled_end_at ?? '',
    priority: item.is_priority ?? false,
  };
}
