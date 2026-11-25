import { serializeDraft, type PlanDraft } from '@/features/today/draft';
import type { Proposal } from '../parser';
import { initialVoiceState, voiceReducer, canAdd, isActive } from './reducer';
import {
  proposalToDraft,
  resolvedByPatch,
  tomorrow,
  withDate,
  withOffset,
  withTimes,
} from './draft';

const NY = 'America/New_York';
const base: PlanDraft = {
  title: 'Call mom',
  date: '2026-11-19',
  timezone: NY,
  scheduled: false,
  start: '',
  end: '',
  priority: false,
};
const proposal = (overrides: Partial<Proposal>): Proposal => ({
  title: 'Call mom',
  date: '2026-11-19',
  dateSource: 'spoken',
  startTime: null,
  endTime: null,
  isPriority: false,
  ...overrides,
});

describe('card to PlanDraft (VX-08)', () => {
  it('maps an unscheduled proposal', () => {
    expect(proposalToDraft(proposal({ isPriority: true }), NY)).toEqual({
      draft: { ...base, priority: true },
      extra: [],
    });
  });

  it('maps times to real instants that serializeDraft accepts exactly like manual entry', () => {
    const { draft } = proposalToDraft(proposal({ startTime: '09:00', endTime: '11:30' }), NY);
    expect(draft).toMatchObject({
      scheduled: true,
      start: '2026-11-19T09:00:00-05:00',
      end: '2026-11-19T11:30:00-05:00',
    });
    expect(serializeDraft(draft).payload).toMatchObject({
      scheduled_start_at: '2026-11-19T09:00:00-05:00',
      scheduled_end_at: '2026-11-19T11:30:00-05:00',
    });
  });

  it('uses the offset in force on that date', () => {
    const { draft } = proposalToDraft(proposal({ date: '2026-07-04', startTime: '09:00' }), NY);
    expect(draft.start).toBe('2026-07-04T09:00:00-04:00');
  });

  it('never guesses a time in a spring-forward gap or a fall-back fold', () => {
    const gap = withTimes({ ...base, date: '2027-03-14' }, '02:30', null);
    expect(gap.draft).toMatchObject({ scheduled: true, start: '' });
    expect(gap.extra).toEqual([{ kind: 'time_nonexistent' }]);
    const fold = withTimes({ ...base, date: '2027-11-07' }, '01:30', null);
    expect(fold.draft.start).toBe('');
    expect(fold.extra).toEqual([
      {
        kind: 'time_ambiguous_offset',
        options: [
          { label: 'UTC-04:00', offset: '-04:00' },
          { label: 'UTC-05:00', offset: '-05:00' },
        ],
      },
    ]);
  });

  it('does not repeat a clarification the parser already raised', () => {
    const gap = withTimes({ ...base, date: '2027-03-14' }, '02:30', null, [
      { kind: 'time_nonexistent' },
    ]);
    expect(gap.extra).toEqual([]);
  });

  it('picks the chosen side of a fold', () => {
    const early = withOffset({ ...base, date: '2027-11-07' }, '01:30', '01:45', '-04:00');
    expect(early).toMatchObject({
      start: '2027-11-07T01:30:00-04:00',
      end: '2027-11-07T01:45:00-04:00',
    });
    const late = withOffset({ ...base, date: '2027-11-07' }, '01:30', null, '-05:00');
    expect(late.start).toBe('2027-11-07T01:30:00-05:00');
  });

  it('moves a date but keeps the spoken clock time', () => {
    const scheduled = {
      ...base,
      scheduled: true,
      start: '2026-11-19T07:00:00-05:00',
      end: '2026-11-19T08:00:00-05:00',
    };
    const moved = withDate(scheduled, tomorrow('2026-11-19'));
    expect(moved.draft).toMatchObject({
      date: '2026-11-20',
      start: '2026-11-20T07:00:00-05:00',
      end: '2026-11-20T08:00:00-05:00',
    });
    expect(withDate(base, '2026-11-21').draft).toMatchObject({
      date: '2026-11-21',
      start: '',
      end: '',
    });
  });

  it('computes tomorrow across month and year ends', () => {
    expect(tomorrow('2026-12-31')).toBe('2027-01-01');
    expect(tomorrow('2028-02-28')).toBe('2028-02-29');
  });

  it('edits to a date or a start time settle the matching clarifications', () => {
    expect(resolvedByPatch({ date: '2026-11-20' })).toEqual(
      expect.arrayContaining(['next_weekday', 'date_invalid', 'date_unsupported', 'time_passed']),
    );
    expect(resolvedByPatch({ start: '2026-11-19T07:00:00-05:00' })).toEqual(['time_passed']);
    expect(resolvedByPatch({ start: '' })).toEqual([]);
    expect(resolvedByPatch({ title: 'x' })).toEqual([]);
  });
});

describe('session reducer rules', () => {
  const open = (state = initialVoiceState) =>
    voiceReducer(state, {
      type: 'open',
      account: 'a',
      entry: 'today',
      contextDate: '2026-11-18',
      consentSeen: true,
      now: 1,
    });

  it('starts at idle, opens one session and ignores a second open', () => {
    expect(initialVoiceState.phase).toBe('idle');
    const first = open();
    expect(first.phase).toBe('requesting_permission');
    expect(open(first)).toBe(first);
  });

  it('a pending or unconfirmed save survives closing the sheet but not a purge', () => {
    const saving = { ...open(), phase: 'saving' as const };
    expect(voiceReducer(saving, { type: 'reset' })).toBe(saving);
    const unknown = { ...open(), phase: 'unknown_outcome' as const };
    expect(voiceReducer(unknown, { type: 'reset' })).toBe(unknown);
    expect(voiceReducer(unknown, { type: 'purge' }).phase).toBe('idle');
  });

  it('only the review phase can add, and only with nothing pending', () => {
    expect(canAdd({ ...initialVoiceState, phase: 'listening' })).toBe(false);
    expect(canAdd({ ...initialVoiceState, phase: 'saving' })).toBe(false);
    expect(canAdd({ ...initialVoiceState, phase: 'review' })).toBe(true);
    expect(isActive('saving')).toBe(true);
    expect(isActive('done')).toBe(false);
    expect(isActive('discarded')).toBe(false);
  });

  it('keeps no words after a discard', () => {
    const state = { ...open(), phase: 'review' as const, heard: 'secret words', partial: 'secret' };
    const next = voiceReducer(state, { type: 'discard', reason: 'cancelled' });
    expect(next.heard).toBe('');
    expect(next.partial).toBe('');
    expect(next.draft).toBeNull();
  });
});
