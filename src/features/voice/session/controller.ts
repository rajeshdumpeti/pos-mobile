import { ApiError } from '@/api';
import type { DraftErrors, PlanDraft } from '@/features/today/draft';
import { serializeDraft } from '@/features/today/draft';
import { createCreationCoordinator, type CreationCoordinator } from '@/features/today/creation';
import { isAmbiguousCreation, mapPlanningFailure } from '@/features/today/failure';
import type { PlanItem } from '@/features/today/types';
import { parseVoiceInput, type ParseInput, type ParseResult } from '../parser';
import type { VoiceNative } from '../availability';
import { clearVoicePrefill } from '../prefill';
import {
  pendingClarifications,
  proposalToDraft,
  resolvedByPatch,
  tomorrow,
  withDate,
  withOffset,
  withTimes,
} from './draft';
import { canAdd, initialVoiceState, isActive, voiceReducer } from './reducer';
import type { VoiceAction, VoiceEntryPoint, VoiceSessionState } from './types';

export const VOICE_LIMITS = {
  maxDurationMs: 30_000,
  silenceTimeoutMs: 1_500,
  idleExpiryMs: 10 * 60_000,
  backgroundExpiryMs: 5 * 60_000,
  saveTimeoutMs: 8_000,
  replayDelaysMs: [1_000, 3_000, 9_000],
  finalWaitMs: 600,
} as const;

/** The slice of the planning scope the voice session needs. */
export type VoicePlanning = {
  account: string;
  service: {
    create: (
      credential: string,
      body: Parameters<CreationCoordinator['submit']>[0],
      key: string,
      options?: { entrySource?: 'voice'; timeoutMs?: number },
    ) => Promise<PlanItem>;
  };
  credential: () => string;
  current: () => boolean;
  recover: (error: unknown) => Promise<void>;
};

export type VoiceControllerDeps = {
  native: VoiceNative;
  planning: VoicePlanning;
  parse?: (input: ParseInput) => ParseResult;
  now?: () => Date;
  timezone: () => string | undefined;
  connectivity: () => 'online' | 'offline' | string;
  consentSeen: () => boolean;
  markConsentSeen: () => void;
  onCreated: (item: PlanItem) => Promise<void> | void;
  refreshAvailability?: () => void;
  haptic?: (kind: 'start' | 'stop' | 'success') => void;
  announce?: (message: string) => void;
  beforeListening?: () => Promise<void>;
  sleep?: (ms: number) => Promise<void>;
  createCoordinator?: () => CreationCoordinator;
};

export type OpenResult = 'opened' | 'resumed' | 'ignored';

/**
 * Orchestrates one voice entry session. Memory only: nothing here writes to storage, logs,
 * navigation state or the query cache. Words and card values live in `state` and nowhere else.
 */
export function createVoiceSessionController(deps: VoiceControllerDeps) {
  const parse = deps.parse ?? parseVoiceInput;
  const now = deps.now ?? (() => new Date());
  const sleep =
    deps.sleep ?? ((ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms)));
  const announce = deps.announce ?? (() => undefined);
  const haptic = deps.haptic ?? (() => undefined);

  let state: VoiceSessionState = initialVoiceState;
  const listeners = new Set<() => void>();
  let coordinator: CreationCoordinator | undefined;
  let idleTimer: ReturnType<typeof setTimeout> | undefined;
  let backgroundTimer: ReturnType<typeof setTimeout> | undefined;
  let backgroundedAt: number | undefined;
  let subscriptions: Array<{ remove(): void }> = [];
  let finalText: string | null = null;
  let finalWaiter: (() => void) | undefined;
  let disposed = false;

  const nowMs = () => now().getTime();

  function clearIdle() {
    if (idleTimer !== undefined) clearTimeout(idleTimer);
    idleTimer = undefined;
  }
  function clearBackground() {
    if (backgroundTimer !== undefined) clearTimeout(backgroundTimer);
    backgroundTimer = undefined;
    backgroundedAt = undefined;
  }
  function removeSubscriptions() {
    for (const subscription of subscriptions.splice(0)) {
      try {
        subscription.remove();
      } catch {
        /* Nothing to clean up. */
      }
    }
  }

  function dispatch(action: VoiceAction) {
    const next = voiceReducer(state, action);
    if (next === state) return;
    state = next;
    // Every interaction restarts the idle clock while a card is open (VX-19).
    clearIdle();
    if (state.phase === 'review' || state.phase === 'clarifying') {
      idleTimer = setTimeout(() => {
        if (
          (state.phase === 'review' || state.phase === 'clarifying') &&
          nowMs() - state.lastInteractionAt >= VOICE_LIMITS.idleExpiryMs
        )
          discard('idle_expired');
      }, VOICE_LIMITS.idleExpiryMs);
    }
    for (const listener of [...listeners]) listener();
  }

  /** A session is alive while it is the current one, for the signed-in account. */
  function alive(sessionId: number): boolean {
    return !disposed && state.sessionId === sessionId && deps.planning.current();
  }

  function discard(reason: Parameters<typeof discardAction>[0], notice?: string | null) {
    if (state.phase === 'listening' || state.phase === 'requesting_permission') {
      void Promise.resolve(deps.native.cancel()).catch(() => undefined);
    }
    removeSubscriptions();
    clearBackground();
    dispatch(discardAction(reason, notice));
    if (reason !== 'unauthorized' && reason !== 'forbidden') coordinator = undefined;
  }

  // ------------------------------------------------------------------ opening and listening

  function open(entry: VoiceEntryPoint, contextDate: string): OpenResult {
    if (disposed || !deps.planning.current()) return 'ignored';
    const before = state;
    if (!isActive(before.phase)) {
      coordinator = undefined;
      finalText = null;
      clearVoicePrefill();
    }
    dispatch({
      type: 'open',
      account: deps.planning.account,
      entry,
      contextDate,
      consentSeen: deps.consentSeen(),
      now: nowMs(),
    });
    if (state.sessionId === before.sessionId) return 'resumed';
    if (state.phase === 'requesting_permission') void beginListening(state.sessionId);
    return 'opened';
  }

  function continueConsent() {
    if (state.phase !== 'consent') return;
    deps.markConsentSeen();
    dispatch({ type: 'consent_continue', now: nowMs() });
    void beginListening(state.sessionId);
  }

  async function beginListening(sessionId: number) {
    let permissions;
    try {
      permissions = await deps.native.requestPermissions();
    } catch {
      permissions = undefined;
    }
    if (!alive(sessionId) || state.phase !== 'requesting_permission') return;
    if (!permissions || permissions.microphone !== 'granted' || permissions.speech !== 'granted') {
      dispatch({ type: 'permission_denied' });
      deps.refreshAvailability?.();
      return;
    }
    try {
      await deps.beforeListening?.();
    } catch {
      /* The announcement is a courtesy; listening still starts. */
    }
    if (!alive(sessionId) || state.phase !== 'requesting_permission') return;

    finalText = null;
    subscriptions = [
      deps.native.onStateChange((event) => {
        if (!alive(sessionId)) return;
        if (event.state === 'listening') {
          dispatch({ type: 'listening', now: nowMs() });
          haptic('start');
          announce('Listening');
        }
      }),
      deps.native.onPartial((event) => {
        if (alive(sessionId)) dispatch({ type: 'partial', text: event.text });
      }),
      deps.native.onFinal((event) => {
        if (!alive(sessionId)) return;
        finalText = event.text;
        finalWaiter?.();
      }),
      deps.native.onEnd((event) => {
        if (alive(sessionId)) void handleEnd(sessionId, event.reason);
      }),
    ];
    try {
      await deps.native.start({
        locale: 'en-US',
        maxDurationMs: VOICE_LIMITS.maxDurationMs,
        silenceTimeoutMs: VOICE_LIMITS.silenceTimeoutMs,
      });
    } catch {
      removeSubscriptions();
      if (alive(sessionId)) dispatch({ type: 'start_failed' });
    }
  }

  async function handleEnd(sessionId: number, reason: string) {
    if (state.phase !== 'listening' && state.phase !== 'requesting_permission') return;
    if (reason === 'cancelled') {
      discard('cancelled');
      return;
    }
    if (reason === 'interrupted' || reason === 'backgrounded' || reason === 'error') {
      removeSubscriptions();
      haptic('stop');
      dispatch({
        type: 'failed',
        failure: { kind: reason === 'error' ? 'listen_error' : reason },
      });
      announce('Voice stopped. Try again.');
      return;
    }
    // stopped | silence | max_duration deliver final text; give it a moment to arrive.
    haptic('stop');
    announce('Stopped listening');
    if (finalText === null) {
      await new Promise<void>((resolve) => {
        const timer = setTimeout(resolve, VOICE_LIMITS.finalWaitMs);
        finalWaiter = () => {
          clearTimeout(timer);
          resolve();
        };
      });
      finalWaiter = undefined;
    }
    removeSubscriptions();
    if (!alive(sessionId)) return;
    review(sessionId, finalText ?? '');
  }

  function review(sessionId: number, text: string) {
    if (!alive(sessionId)) return;
    const zone = deps.timezone();
    dispatch({ type: 'heard', text });
    if (!zone) {
      dispatch({ type: 'failed', failure: { kind: 'no_timezone' } });
      return;
    }
    const result = parse({
      text,
      contextDate: state.contextDate,
      timezone: zone,
      now: now(),
    });
    if (result.kind === 'rejection') {
      dispatch({ type: 'failed', failure: { kind: 'rejection', reason: result.reason } });
      announce('Voice could not add that.');
      return;
    }
    const { draft, extra } = proposalToDraft(result.proposal, zone, result.clarifications);
    dispatch({
      type: 'parsed',
      proposal: result.proposal,
      draft,
      clarifications: [...result.clarifications, ...extra],
      hints: result.hints,
      now: nowMs(),
    });
    announce(
      pendingClarifications(state).length > 0
        ? 'Review the task. A choice is needed before you can add it.'
        : 'Review the task, then tap Add.',
    );
  }

  function stop() {
    if (state.phase === 'listening')
      void Promise.resolve(deps.native.stop()).catch(() => undefined);
  }

  function tryAgain() {
    if (state.phase !== 'failed') return;
    const { entry, contextDate } = state;
    dispatch({ type: 'reset' });
    open(entry, contextDate);
  }

  // ------------------------------------------------------------------ the review card

  function edit(patch: Partial<PlanDraft>) {
    const draft = state.draft;
    if (!draft || (state.phase !== 'review' && state.phase !== 'clarifying')) return;
    dispatch({
      type: 'apply',
      draft: { ...draft, ...patch },
      resolve: resolvedByPatch(patch),
      extra: [],
      now: nowMs(),
    });
  }

  function chooseMeridiem(index: number) {
    const draft = state.draft;
    const clarification = state.clarifications.find((c) => c.kind === 'meridiem');
    const option = clarification?.kind === 'meridiem' ? clarification.options[index] : undefined;
    if (!draft || !option) return;
    const { draft: next, extra } = withTimes(
      draft,
      option.startTime,
      option.endTime,
      state.clarifications,
    );
    dispatch({ type: 'apply', draft: next, resolve: ['meridiem'], extra, now: nowMs() });
  }

  function chooseWeekday(index: number) {
    const draft = state.draft;
    const clarification = state.clarifications.find((c) => c.kind === 'next_weekday');
    const option =
      clarification?.kind === 'next_weekday' ? clarification.options[index] : undefined;
    if (!draft || !option) return;
    const { draft: next, extra } = withDate(draft, option.date);
    dispatch({
      type: 'apply',
      draft: next,
      resolve: ['next_weekday', 'time_passed'],
      extra,
      now: nowMs(),
    });
  }

  function chooseOffset(index: number) {
    const draft = state.draft;
    const clarification = state.clarifications.find((c) => c.kind === 'time_ambiguous_offset');
    const option =
      clarification?.kind === 'time_ambiguous_offset' ? clarification.options[index] : undefined;
    const proposal = state.proposal;
    if (!draft || !option || !proposal?.startTime) return;
    dispatch({
      type: 'apply',
      draft: withOffset(draft, proposal.startTime, proposal.endTime, option.offset),
      resolve: ['time_ambiguous_offset'],
      extra: [],
      now: nowMs(),
    });
  }

  /** A date picker was confirmed, even if the chosen date did not change. */
  function markDatePicked() {
    const draft = state.draft;
    if (draft)
      dispatch({
        type: 'apply',
        draft,
        resolve: ['next_weekday', 'date_invalid', 'date_unsupported', 'time_passed'],
        extra: [],
        now: nowMs(),
      });
  }

  function keepToday() {
    const draft = state.draft;
    if (draft)
      dispatch({ type: 'apply', draft, resolve: ['time_passed'], extra: [], now: nowMs() });
  }

  function moveToTomorrow() {
    const draft = state.draft;
    if (!draft) return;
    const { draft: next, extra } = withDate(draft, tomorrow(draft.date));
    dispatch({ type: 'apply', draft: next, resolve: ['time_passed'], extra, now: nowMs() });
  }

  // ------------------------------------------------------------------ saving

  function save() {
    if (!canAdd(state) || !state.draft) return;
    const serialized = serializeDraft(state.draft);
    if (serialized.errors) {
      dispatch({ type: 'field_errors', errors: serialized.errors as DraftErrors, notice: null });
      announce('Review the highlighted fields.');
      return;
    }
    if (deps.connectivity() === 'offline') {
      dispatch({
        type: 'field_errors',
        errors: {},
        notice: 'You’re offline. Reconnect, then tap Add.',
      });
      return;
    }
    coordinator ??= (deps.createCoordinator ?? createCreationCoordinator)();
    const sessionId = state.sessionId;
    const payload = serialized.payload;
    dispatch({ type: 'save_started' });
    void runSave(sessionId, payload);
  }

  function retryUnknown() {
    const attempt = coordinator?.getAttempt();
    if (state.phase !== 'unknown_outcome' || !attempt) return;
    const sessionId = state.sessionId;
    dispatch({ type: 'save_started' });
    void runSave(sessionId, { ...attempt.payload });
  }

  async function runSave(sessionId: number, payload: Parameters<CreationCoordinator['submit']>[0]) {
    const active = coordinator;
    if (!active) return;
    for (let replay = 0; ; replay += 1) {
      try {
        const item = await active.submit(payload, (body, key) =>
          deps.planning.service.create(deps.planning.credential(), body, key, {
            entrySource: 'voice',
            timeoutMs: VOICE_LIMITS.saveTimeoutMs,
          }),
        );
        if (!alive(sessionId)) return;
        if (!item) return; // A save is already running; never send a second one.
        try {
          await deps.onCreated(item);
        } catch {
          /* Cache refresh failures never undo a confirmed save. */
        }
        if (!alive(sessionId)) return;
        dispatch({ type: 'save_succeeded', item });
        announce('Plan item creation confirmed.');
        return;
      } catch (error) {
        if (!alive(sessionId)) return;
        if (isAmbiguousCreation(error)) {
          const delay = VOICE_LIMITS.replayDelaysMs[replay];
          if (delay === undefined) {
            dispatch({ type: 'save_unknown' });
            announce('Couldn’t confirm. Check Today before adding it again.');
            return;
          }
          dispatch({ type: 'save_replay', replays: replay + 1 });
          await sleep(delay);
          if (!alive(sessionId) || state.phase !== 'saving') return;
          continue;
        }
        handleSaveFailure(sessionId, error);
        return;
      }
    }
  }

  function handleSaveFailure(sessionId: number, error: unknown) {
    if (!alive(sessionId)) return;
    const failure = mapPlanningFailure(error);
    const status = error instanceof ApiError ? error.metadata.status : undefined;
    if (status === 401) {
      discard('unauthorized');
      void deps.planning.recover(error);
    } else if (status === 403) {
      discard('forbidden', failure.message);
      void deps.planning.recover(error);
    } else if (status === 422) {
      dispatch({
        type: 'back_to_review',
        errors: {},
        notice: 'Check the title, date and times. Nothing was added.',
        now: nowMs(),
      });
    } else if (failure.kind === 'idempotencyConflict') {
      dispatch({ type: 'failed', failure: { kind: 'save_conflict' } });
    } else if (failure.kind === 'rateLimited') {
      dispatch({
        type: 'back_to_review',
        errors: {},
        notice: failure.message,
        now: nowMs(),
      });
    } else {
      dispatch({ type: 'failed', failure: { kind: 'save_unavailable', message: failure.message } });
    }
  }

  // ------------------------------------------------------------------ lifecycle

  function cancel() {
    if (state.phase === 'saving' || state.phase === 'unknown_outcome' || state.phase === 'idle')
      return;
    discard('cancelled');
  }

  /** Closing the sheet after a terminal state. A pending save is never forgotten. */
  function dismiss() {
    if (state.phase === 'done' || state.phase === 'discarded' || state.phase === 'failed')
      dispatch({ type: 'reset' });
  }

  function appStateChanged(next: string) {
    const card = state.phase === 'review' || state.phase === 'clarifying';
    if (next === 'background' && card) {
      clearBackground();
      backgroundedAt = nowMs();
      backgroundTimer = setTimeout(() => {
        if (state.phase === 'review' || state.phase === 'clarifying') discard('background_expired');
      }, VOICE_LIMITS.backgroundExpiryMs);
    } else if (next === 'active') {
      const elapsed = backgroundedAt === undefined ? 0 : nowMs() - backgroundedAt;
      clearBackground();
      if (card && elapsed >= VOICE_LIMITS.backgroundExpiryMs) discard('background_expired');
      deps.refreshAvailability?.();
    }
  }

  /** Sign-out, session expiry or account change: forget everything immediately (VX-17). */
  function purge() {
    if (state.phase === 'listening' || state.phase === 'requesting_permission')
      void Promise.resolve(deps.native.cancel()).catch(() => undefined);
    removeSubscriptions();
    clearIdle();
    clearBackground();
    coordinator?.reset();
    coordinator = undefined;
    finalText = null;
    clearVoicePrefill();
    dispatch({ type: 'purge' });
  }

  function dispose() {
    purge();
    disposed = true;
    listeners.clear();
  }

  /** What was understood, for the manual form. Never includes anything that was not heard. */
  function prefill(): Partial<PlanDraft> | undefined {
    if (state.draft) {
      const { title, date, scheduled, start, end, priority } = state.draft;
      return { title, date, scheduled, start, end, priority };
    }
    const failure = state.failure;
    if (
      state.heard.trim() !== '' &&
      failure?.kind === 'rejection' &&
      (failure.reason === 'multiple_requests' || failure.reason === 'past_date')
    )
      return { title: state.heard.trim().slice(0, 200) };
    return undefined;
  }

  return {
    getState: () => state,
    subscribe: (listener: () => void) => {
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    },
    open,
    continueConsent,
    stop,
    cancel,
    tryAgain,
    edit,
    chooseMeridiem,
    chooseWeekday,
    chooseOffset,
    keepToday,
    moveToTomorrow,
    markDatePicked,
    save,
    retryUnknown,
    dismiss,
    appStateChanged,
    purge,
    dispose,
    prefill,
  };
}
export type VoiceSessionController = ReturnType<typeof createVoiceSessionController>;

function discardAction(
  reason: Extract<VoiceAction, { type: 'discard' }>['reason'],
  notice?: string | null,
): VoiceAction {
  return { type: 'discard', reason, notice };
}
