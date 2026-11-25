import { pendingClarifications } from './draft';
import type { VoiceAction, VoicePhase, VoiceSessionState } from './types';

export const initialVoiceState: VoiceSessionState = {
  phase: 'idle',
  sessionId: 0,
  account: null,
  entry: 'today',
  contextDate: '',
  partial: '',
  heard: '',
  proposal: null,
  draft: null,
  clarifications: [],
  resolved: [],
  hints: [],
  fieldErrors: {},
  notice: null,
  failure: null,
  savedItem: null,
  replays: 0,
  discardReason: null,
  lastInteractionAt: 0,
  listeningStartedAt: null,
};

/** Phases in which a session still owns the mic button, the sheet or a pending save. */
export const activePhases: readonly VoicePhase[] = [
  'consent',
  'requesting_permission',
  'listening',
  'parsing',
  'review',
  'clarifying',
  'saving',
  'unknown_outcome',
];

export function isActive(phase: VoicePhase): boolean {
  return activePhases.includes(phase);
}

/** Add is possible only when nothing is pending and no save is in flight. */
export function canAdd(state: VoiceSessionState): boolean {
  return state.phase === 'review' && pendingClarifications(state).length === 0;
}

function reviewPhase(state: VoiceSessionState): VoicePhase {
  return pendingClarifications(state).length > 0 ? 'clarifying' : 'review';
}

export function voiceReducer(state: VoiceSessionState, action: VoiceAction): VoiceSessionState {
  switch (action.type) {
    case 'open':
      // One session at a time; a save with an unknown outcome blocks a new one (VX-15).
      if (isActive(state.phase)) return state;
      return {
        ...initialVoiceState,
        sessionId: state.sessionId + 1,
        phase: action.consentSeen ? 'requesting_permission' : 'consent',
        account: action.account,
        entry: action.entry,
        contextDate: action.contextDate,
        lastInteractionAt: action.now,
      };
    case 'consent_continue':
      return state.phase === 'consent'
        ? { ...state, phase: 'requesting_permission', lastInteractionAt: action.now }
        : state;
    case 'permission_denied':
      return state.phase === 'requesting_permission'
        ? { ...state, phase: 'failed', failure: { kind: 'permission_denied' } }
        : state;
    case 'start_failed':
      return state.phase === 'requesting_permission'
        ? { ...state, phase: 'failed', failure: { kind: 'start_failed' } }
        : state;
    case 'listening':
      return state.phase === 'requesting_permission'
        ? { ...state, phase: 'listening', partial: '', listeningStartedAt: action.now }
        : state;
    case 'partial':
      return state.phase === 'listening' ? { ...state, partial: action.text } : state;
    case 'heard':
      return state.phase === 'listening' || state.phase === 'requesting_permission'
        ? { ...state, phase: 'parsing', heard: action.text, partial: '' }
        : state;
    case 'parsed': {
      if (state.phase !== 'parsing') return state;
      const next = {
        ...state,
        proposal: action.proposal,
        draft: action.draft,
        clarifications: action.clarifications,
        resolved: [],
        hints: action.hints,
        fieldErrors: {},
        notice: null,
        lastInteractionAt: action.now,
      };
      return { ...next, phase: reviewPhase(next) };
    }
    case 'failed':
      return ['requesting_permission', 'listening', 'parsing', 'saving'].includes(state.phase)
        ? { ...state, phase: 'failed', failure: action.failure, partial: '' }
        : state;
    case 'apply': {
      if (state.phase !== 'review' && state.phase !== 'clarifying') return state;
      const next = {
        ...state,
        draft: action.draft,
        resolved: [...new Set([...state.resolved, ...action.resolve])],
        clarifications: [...state.clarifications, ...action.extra],
        fieldErrors: {},
        notice: null,
        lastInteractionAt: action.now,
      };
      return { ...next, phase: reviewPhase(next) };
    }
    case 'field_errors':
      return state.phase === 'review' || state.phase === 'clarifying'
        ? { ...state, fieldErrors: action.errors, notice: action.notice }
        : state;
    case 'save_started':
      return state.phase === 'review' || state.phase === 'unknown_outcome'
        ? { ...state, phase: 'saving', replays: 0, notice: null, fieldErrors: {} }
        : state;
    case 'save_replay':
      return state.phase === 'saving' ? { ...state, replays: action.replays } : state;
    case 'save_unknown':
      return state.phase === 'saving' ? { ...state, phase: 'unknown_outcome' } : state;
    case 'save_succeeded':
      return state.phase === 'saving' ? { ...state, phase: 'done', savedItem: action.item } : state;
    case 'back_to_review': {
      if (state.phase !== 'saving') return state;
      const next = {
        ...state,
        fieldErrors: action.errors,
        notice: action.notice,
        lastInteractionAt: action.now,
      };
      return { ...next, phase: reviewPhase(next) };
    }
    case 'discard':
      return state.phase === 'idle' || state.phase === 'done'
        ? state
        : {
            ...initialVoiceState,
            sessionId: state.sessionId,
            phase: 'discarded',
            discardReason: action.reason,
            notice: action.notice ?? null,
          };
    case 'purge':
      // Sign-out, session expiry or account change: forget everything, including a pending save.
      return { ...initialVoiceState, sessionId: state.sessionId + 1 };
    case 'reset':
      // A pending or unconfirmed save is never forgotten by closing the sheet.
      return state.phase === 'saving' || state.phase === 'unknown_outcome'
        ? state
        : { ...initialVoiceState, sessionId: state.sessionId };
  }
}
