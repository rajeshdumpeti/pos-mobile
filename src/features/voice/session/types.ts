import type { PlanDraft, DraftErrors } from '@/features/today/draft';
import type { PlanItem } from '@/features/today/types';
import type { Clarification, Hint, Proposal, RejectionReason } from '../parser';

export type VoicePhase =
  | 'idle'
  | 'consent'
  | 'requesting_permission'
  | 'listening'
  | 'parsing'
  | 'review'
  | 'clarifying'
  | 'saving'
  | 'unknown_outcome'
  | 'done'
  | 'failed'
  | 'discarded';

/** Where the mic was tapped; decides the default date source and the toast copy only. */
export type VoiceEntryPoint = 'today' | 'plan' | 'quick_log';

export type VoiceFailure =
  | { kind: 'permission_denied' }
  | { kind: 'start_failed' }
  | { kind: 'interrupted' }
  | { kind: 'backgrounded' }
  | { kind: 'listen_error' }
  | { kind: 'rejection'; reason: RejectionReason }
  | { kind: 'no_timezone' }
  | { kind: 'save_conflict' }
  | { kind: 'save_unavailable'; message: string };

export type DiscardReason =
  | 'cancelled'
  | 'idle_expired'
  | 'background_expired'
  | 'signed_out'
  | 'unauthorized'
  | 'forbidden'
  | 'account_changed';

/** Memory only. Nothing here is ever persisted, logged or placed in navigation state. */
export type VoiceSessionState = {
  phase: VoicePhase;
  sessionId: number;
  account: string | null;
  entry: VoiceEntryPoint;
  contextDate: string;
  /** Live words while listening; shown on screen only. */
  partial: string;
  /** What was heard, for the review card's "Heard:" line. */
  heard: string;
  proposal: Proposal | null;
  draft: PlanDraft | null;
  clarifications: Clarification[];
  resolved: string[];
  hints: Hint[];
  fieldErrors: DraftErrors;
  notice: string | null;
  failure: VoiceFailure | null;
  savedItem: PlanItem | null;
  /** 0 on the first attempt; counts automatic replays during a save. */
  replays: number;
  discardReason: DiscardReason | null;
  /** Epoch ms of the last interaction, for the 10-minute idle expiry. */
  lastInteractionAt: number;
  listeningStartedAt: number | null;
};

export type VoiceAction =
  | {
      type: 'open';
      account: string;
      entry: VoiceEntryPoint;
      contextDate: string;
      consentSeen: boolean;
      now: number;
    }
  | { type: 'consent_continue'; now: number }
  | { type: 'permission_denied' }
  | { type: 'start_failed' }
  | { type: 'listening'; now: number }
  | { type: 'partial'; text: string }
  | { type: 'heard'; text: string }
  | {
      type: 'parsed';
      proposal: Proposal;
      draft: PlanDraft;
      clarifications: Clarification[];
      hints: Hint[];
      now: number;
    }
  | { type: 'failed'; failure: VoiceFailure }
  | { type: 'apply'; draft: PlanDraft; resolve: string[]; extra: Clarification[]; now: number }
  | { type: 'field_errors'; errors: DraftErrors; notice: string | null }
  | { type: 'save_started' }
  | { type: 'save_replay'; replays: number }
  | { type: 'save_unknown' }
  | { type: 'save_succeeded'; item: PlanItem }
  | { type: 'back_to_review'; errors: DraftErrors; notice: string | null; now: number }
  | { type: 'discard'; reason: DiscardReason; notice?: string | null }
  | { type: 'purge' }
  | { type: 'reset' };
