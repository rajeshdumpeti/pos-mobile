import { adjacentDate } from '@/features/plan/calendar';
import type { PlanDraft } from '@/features/today/draft';
import { wallClock, wallTimeCandidates } from '@/features/today/presentation';
import type { Clarification, Proposal } from '../parser';
import type { VoiceSessionState } from './types';

/** The UTC offset suffix of an ISO timestamp, such as "-04:00". */
function offsetOf(timestamp: string): string {
  return /([+-]\d{2}:\d{2}|Z)$/.exec(timestamp)?.[1] ?? '';
}

/**
 * Puts HH:MM wall times on the draft's date as real instants. A time that does not exist
 * (spring-forward gap) or occurs twice (fall-back) is never guessed: it stays empty and is
 * reported as a clarification, exactly as the manual form's ScheduleFields does.
 */
export function withTimes(
  draft: PlanDraft,
  startTime: string,
  endTime: string | null,
  known: readonly Clarification[] = [],
): { draft: PlanDraft; extra: Clarification[] } {
  const extra: Clarification[] = [];
  const has = (kind: Clarification['kind']) => known.some((c) => c.kind === kind);
  const starts = wallTimeCandidates(draft.date, startTime, draft.timezone);
  let start = '';
  if (starts.length === 1) start = starts[0] ?? '';
  else if (starts.length === 0 && !has('time_nonexistent'))
    extra.push({ kind: 'time_nonexistent' });
  else if (starts.length > 1 && !has('time_ambiguous_offset'))
    extra.push({
      kind: 'time_ambiguous_offset',
      options: starts.map((value) => ({
        label: `UTC${offsetOf(value)}`,
        offset: offsetOf(value),
      })),
    });
  let end = '';
  if (endTime !== null && start !== '') {
    const ends = wallTimeCandidates(draft.date, endTime, draft.timezone);
    if (ends.length === 1) end = ends[0] ?? '';
  }
  return { draft: { ...draft, scheduled: true, start, end }, extra };
}

/** Card -> the existing PlanDraft, so serializeDraft validates exactly like manual entry. */
export function proposalToDraft(
  proposal: Proposal,
  zone: string,
  known: readonly Clarification[] = [],
): { draft: PlanDraft; extra: Clarification[] } {
  const base: PlanDraft = {
    title: proposal.title,
    date: proposal.date,
    timezone: zone,
    scheduled: false,
    start: '',
    end: '',
    priority: proposal.isPriority,
  };
  if (proposal.startTime === null) return { draft: base, extra: [] };
  return withTimes(base, proposal.startTime, proposal.endTime, known);
}

/** Moves the date but keeps the spoken clock times, re-deriving real instants for the new day. */
export function withDate(
  draft: PlanDraft,
  date: string,
): { draft: PlanDraft; extra: Clarification[] } {
  const moved = { ...draft, date };
  if (!draft.scheduled || draft.start === '')
    return { draft: { ...moved, start: '', end: '' }, extra: [] };
  const start = wallClock(new Date(draft.start), draft.timezone);
  const end = draft.end ? wallClock(new Date(draft.end), draft.timezone) : null;
  return withTimes(moved, start, end);
}

export function tomorrow(date: string): string {
  return adjacentDate(date, 1);
}

/** Picks the instant with a given UTC offset for an ambiguous (fall-back) time. */
export function withOffset(
  draft: PlanDraft,
  startTime: string,
  endTime: string | null,
  offset: string,
): PlanDraft {
  const starts = wallTimeCandidates(draft.date, startTime, draft.timezone);
  const start = starts.find((value) => offsetOf(value) === offset) ?? '';
  let end = '';
  if (endTime !== null && start !== '') {
    const ends = wallTimeCandidates(draft.date, endTime, draft.timezone);
    end =
      ends.find((value) => offsetOf(value) === offset) ??
      (ends.length === 1 ? (ends[0] ?? '') : '');
  }
  return { ...draft, scheduled: true, start, end };
}

/** Clarifications that still block Add. Edits that fix the problem resolve it too. */
export function isResolved(
  clarification: Clarification,
  resolved: readonly string[],
  draft: PlanDraft,
): boolean {
  switch (clarification.kind) {
    case 'title_missing':
      return draft.title.trim().length > 0;
    case 'midnight':
    case 'time_nonexistent':
    case 'meridiem':
    case 'time_ambiguous_offset':
      return draft.scheduled && draft.start !== '';
    case 'next_weekday':
    case 'date_invalid':
    case 'date_unsupported':
    case 'time_passed':
      return resolved.includes(clarification.kind);
  }
}

export function pendingClarifications(
  state: Pick<VoiceSessionState, 'clarifications' | 'resolved' | 'draft'>,
): Clarification[] {
  const { draft } = state;
  if (!draft) return [];
  return state.clarifications.filter((c) => !isResolved(c, state.resolved, draft));
}

/** Which clarifications an edit settles. Editing a date or a start time makes them stale. */
export function resolvedByPatch(patch: Partial<PlanDraft>): string[] {
  const keys: string[] = [];
  if ('date' in patch) keys.push('next_weekday', 'date_invalid', 'date_unsupported', 'time_passed');
  if ('start' in patch && patch.start) keys.push('time_passed');
  return keys;
}
