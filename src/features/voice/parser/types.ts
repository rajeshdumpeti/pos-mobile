export const VOICE_GRAMMAR_VERSION = '1.0.0';

export type ParseInput = {
  /** Recognized words from the on-device transcriber. */
  text: string;
  /** 'YYYY-MM-DD': today on Today/Quick Log, the selected date on Plan. */
  contextDate: string;
  /** IANA timezone, for example 'America/New_York' (device timezone). */
  timezone: string;
  /** Current instant, used for "today" and past checks. */
  now: Date;
};

export type Proposal = {
  title: string;
  date: string;
  dateSource: 'spoken' | 'context';
  startTime: string | null;
  endTime: string | null;
  isPriority: boolean;
};

export type MeridiemOption = { label: string; startTime: string; endTime: string | null };

export type Clarification =
  | { kind: 'meridiem'; options: MeridiemOption[] }
  | { kind: 'next_weekday'; options: Array<{ label: string; date: string }> }
  | { kind: 'midnight' }
  | {
      kind: 'time_passed';
      options: [{ label: 'Keep today'; date: string }, { label: 'Move to tomorrow'; date: string }];
    }
  | { kind: 'time_nonexistent' }
  | { kind: 'time_ambiguous_offset'; options: Array<{ label: string; offset: string }> }
  | { kind: 'date_invalid' }
  | { kind: 'date_unsupported' }
  | { kind: 'title_missing' };

export type Hint =
  'duration_without_start_ignored' | 'end_after_midnight_dropped' | 'title_truncated';

export type RejectionReason = 'empty' | 'unsupported_action' | 'multiple_requests' | 'past_date';

export type ParseResult =
  | {
      kind: 'proposal';
      proposal: Proposal;
      clarifications: Clarification[];
      hints: Hint[];
      grammarVersion: string;
    }
  | { kind: 'rejection'; reason: RejectionReason; grammarVersion: string };
