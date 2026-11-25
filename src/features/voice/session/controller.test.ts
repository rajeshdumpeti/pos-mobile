import { ApiError } from '@/api';
import { itemFixture } from '@/features/today/testFixtures';
import type { PlanItem } from '@/features/today/types';
import { fakeNative } from '../testSupport';
import { setVoicePrefill, takeVoicePrefill } from '../prefill';
import { createVoiceSessionController, VOICE_LIMITS, type VoiceControllerDeps } from './controller';
import { pendingClarifications } from './draft';

// Synthetic sentences only. Every test runs with the system clock mocked.
const ACCOUNT = '10000000-0000-4000-8000-000000000001';
const NY_NOW = new Date('2026-11-18T19:00:00.000Z'); // Wed 2026-11-18 14:00 in New York

function setup(
  overrides: Partial<VoiceControllerDeps> = {},
  permissions?: { microphone: string; speech: string },
) {
  const { native, emit, handlers } = fakeNative(permissions);
  let current = true;
  const create = jest.fn(
    async (
      _credential: string,
      body: { title: string },
      _key: string,
      _o?: unknown,
    ): Promise<PlanItem> =>
      itemFixture({
        title: body.title,
        scheduled_for_date: '2026-11-19',
        timezone: 'America/New_York',
      }),
  );
  const recover = jest.fn().mockResolvedValue(undefined);
  const onCreated = jest.fn().mockResolvedValue(undefined);
  const announce = jest.fn();
  const haptic = jest.fn();
  const markConsentSeen = jest.fn();
  const refreshAvailability = jest.fn();
  let consent = true;
  const controller = createVoiceSessionController({
    native,
    planning: {
      account: ACCOUNT,
      service: { create },
      credential: () => 'token',
      current: () => current,
      recover,
    },
    timezone: () => 'America/New_York',
    connectivity: () => 'online',
    consentSeen: () => consent,
    markConsentSeen,
    onCreated,
    announce,
    haptic,
    refreshAvailability,
    ...overrides,
  });
  return {
    controller,
    native,
    emit,
    handlers,
    create,
    recover,
    onCreated,
    announce,
    haptic,
    markConsentSeen,
    refreshAvailability,
    setCurrent: (value: boolean) => (current = value),
    setConsent: (value: boolean) => (consent = value),
  };
}

/** Opens, listens and ends with a final sentence, then lets parsing finish. */
async function speak(
  t: ReturnType<typeof setup>,
  text: string,
  reason = 'silence',
  contextDate = '2026-11-18',
) {
  t.controller.open('today', contextDate);
  await flush();
  t.emit.listening();
  t.emit.partial(text);
  t.emit.final(text);
  t.emit.end(reason);
  await flush();
}
async function flush() {
  await jest.advanceTimersByTimeAsync(0);
}
const phase = (t: ReturnType<typeof setup>) => t.controller.getState().phase;

beforeEach(() => {
  jest.useFakeTimers({ now: NY_NOW });
});
afterEach(() => {
  jest.useRealTimers();
  takeVoicePrefill();
});

describe('opening, consent and permissions', () => {
  it('shows the explainer before any permission prompt on first use', async () => {
    const t = setup();
    t.setConsent(false);
    t.controller.open('today', '2026-11-18');
    expect(phase(t)).toBe('consent');
    await flush();
    expect(t.native.requestPermissions).not.toHaveBeenCalled();
    t.controller.continueConsent();
    expect(t.markConsentSeen).toHaveBeenCalledTimes(1);
    await flush();
    expect(t.native.requestPermissions).toHaveBeenCalledTimes(1);
    expect(t.native.start).toHaveBeenCalledWith({
      locale: 'en-US',
      maxDurationMs: 30_000,
      silenceTimeoutMs: 1_500,
    });
    t.emit.listening();
    expect(phase(t)).toBe('listening');
    expect(t.haptic).toHaveBeenCalledWith('start');
  });

  it('goes straight to the microphone once the explainer was seen', async () => {
    const t = setup();
    t.controller.open('today', '2026-11-18');
    expect(phase(t)).toBe('requesting_permission');
    await flush();
    expect(t.native.start).toHaveBeenCalledTimes(1);
  });

  it('declining the explainer never touches permissions or the microphone', async () => {
    const t = setup();
    t.setConsent(false);
    t.controller.open('today', '2026-11-18');
    t.controller.cancel();
    await flush();
    expect(phase(t)).toBe('discarded');
    expect(t.native.requestPermissions).not.toHaveBeenCalled();
    expect(t.native.start).not.toHaveBeenCalled();
  });

  it.each([
    [{ microphone: 'denied', speech: 'granted' }],
    [{ microphone: 'granted', speech: 'denied' }],
    [{ microphone: 'granted', speech: 'restricted' }],
    [{ microphone: 'undetermined', speech: 'undetermined' }],
  ])('does not listen when permission is %j', async (permissions) => {
    const t = setup({}, permissions);
    t.controller.open('today', '2026-11-18');
    await flush();
    expect(phase(t)).toBe('failed');
    expect(t.controller.getState().failure).toEqual({ kind: 'permission_denied' });
    expect(t.native.start).not.toHaveBeenCalled();
    expect(t.refreshAvailability).toHaveBeenCalled();
    expect(t.create).not.toHaveBeenCalled();
  });

  it('fails closed when start rejects', async () => {
    const t = setup();
    t.native.start.mockRejectedValueOnce(new Error('unsupported_os'));
    t.controller.open('today', '2026-11-18');
    await flush();
    expect(t.controller.getState().failure).toEqual({ kind: 'start_failed' });
  });

  it('only one session runs at a time', async () => {
    const t = setup();
    expect(t.controller.open('today', '2026-11-18')).toBe('opened');
    await flush();
    expect(t.controller.open('plan', '2026-12-01')).toBe('resumed');
    expect(t.native.start).toHaveBeenCalledTimes(1);
    expect(t.controller.getState().entry).toBe('today');
  });

  it('waits for the opening announcement before listening when asked to', async () => {
    let release: () => void = () => undefined;
    const t = setup({ beforeListening: () => new Promise<void>((resolve) => (release = resolve)) });
    t.controller.open('today', '2026-11-18');
    await flush();
    expect(t.native.start).not.toHaveBeenCalled();
    release();
    await flush();
    expect(t.native.start).toHaveBeenCalledTimes(1);
  });
});

describe('listening end reasons never write', () => {
  it.each(['silence', 'max_duration', 'stopped'])(
    '%s with words goes to the review card',
    async (reason) => {
      const t = setup();
      await speak(t, 'Workout tomorrow at 7 am', reason);
      expect(phase(t)).toBe('review');
      expect(t.create).not.toHaveBeenCalled();
      expect(t.haptic).toHaveBeenCalledWith('stop');
    },
  );

  it.each(['interrupted', 'backgrounded', 'error'])(
    '%s ends without text and writes nothing',
    async (reason) => {
      const t = setup();
      t.controller.open('today', '2026-11-18');
      await flush();
      t.emit.listening();
      t.emit.partial('Workout tomorrow');
      t.emit.end(reason);
      await flush();
      expect(phase(t)).toBe('failed');
      expect(t.create).not.toHaveBeenCalled();
      expect(t.controller.getState().draft).toBeNull();
    },
  );

  it('cancel while listening discards everything and writes nothing', async () => {
    const t = setup();
    t.controller.open('today', '2026-11-18');
    await flush();
    t.emit.listening();
    t.emit.partial('Workout tomorrow at 7 am');
    t.controller.cancel();
    t.emit.end('cancelled');
    t.emit.final('Workout tomorrow at 7 am');
    await flush();
    expect(t.native.cancel).toHaveBeenCalled();
    expect(phase(t)).toBe('discarded');
    expect(t.controller.getState().draft).toBeNull();
    expect(t.create).not.toHaveBeenCalled();
  });

  it('stop asks the native module to finish and deliver text', async () => {
    const t = setup();
    t.controller.open('today', '2026-11-18');
    await flush();
    t.emit.listening();
    t.controller.stop();
    expect(t.native.stop).toHaveBeenCalledTimes(1);
  });

  it('empty speech is "Didn\'t catch that"', async () => {
    const t = setup();
    await speak(t, '   ', 'silence');
    expect(t.controller.getState().failure).toEqual({ kind: 'rejection', reason: 'empty' });
  });

  it('waits briefly for final text that arrives just after the end event', async () => {
    const t = setup();
    t.controller.open('today', '2026-11-18');
    await flush();
    t.emit.listening();
    t.emit.end('silence');
    await jest.advanceTimersByTimeAsync(200);
    expect(phase(t)).toBe('listening');
    t.emit.final('Call mom tomorrow');
    await flush();
    expect(phase(t)).toBe('review');
    expect(t.controller.getState().draft?.title).toBe('Call mom');
  });

  it.each([
    ['Mark gym as done', 'unsupported_action'],
    ['Gym at 7 and dentist at 3', 'multiple_requests'],
    ['Yesterday call Sam', 'past_date'],
  ])('rejects "%s" as %s with no card', async (text, reason) => {
    const t = setup();
    await speak(t, text);
    expect(t.controller.getState().failure).toEqual({ kind: 'rejection', reason });
    expect(t.controller.getState().draft).toBeNull();
    expect(t.create).not.toHaveBeenCalled();
  });
});

describe('proposal to review card (VX-08, VX-11)', () => {
  it('turns a proposal into the existing PlanDraft with real instants', async () => {
    const t = setup();
    await speak(t, 'Workout tomorrow at 7 am for an hour');
    const state = t.controller.getState();
    expect(state.heard).toBe('Workout tomorrow at 7 am for an hour');
    expect(state.draft).toEqual({
      title: 'Workout',
      date: '2026-11-19',
      timezone: 'America/New_York',
      scheduled: true,
      start: '2026-11-19T07:00:00-05:00',
      end: '2026-11-19T08:00:00-05:00',
      priority: false,
    });
    expect(state.proposal?.dateSource).toBe('spoken');
  });

  it('uses the selected date on Plan when no date is spoken, and spoken dates still win', async () => {
    const plan = setup();
    await speak(plan, 'Call mom', 'silence', '2026-12-05');
    expect(plan.controller.getState().draft?.date).toBe('2026-12-05');
    const spoken = setup();
    await speak(spoken, 'Call mom tomorrow', 'silence', '2026-12-05');
    expect(spoken.controller.getState().draft?.date).toBe('2026-11-19');
  });

  it('carries priority and keeps unscheduled items unscheduled', async () => {
    const t = setup();
    await speak(t, 'Urgent: send invoice');
    expect(t.controller.getState().draft).toMatchObject({
      title: 'Send invoice',
      priority: true,
      scheduled: false,
      start: '',
    });
  });

  it('shows hints without blocking Add', async () => {
    const t = setup();
    await speak(t, 'Water plants daily');
    expect(t.controller.getState().hints).toEqual(['recurrence_not_supported']);
    expect(phase(t)).toBe('review');
  });
});

describe('every clarification blocks Add until resolved', () => {
  const tryAdd = (t: ReturnType<typeof setup>) => {
    t.controller.save();
    return t.create.mock.calls.length;
  };

  it('meridiem', async () => {
    const t = setup();
    await speak(t, 'Meeting at 3');
    expect(phase(t)).toBe('clarifying');
    expect(tryAdd(t)).toBe(0);
    t.controller.chooseMeridiem(1);
    expect(phase(t)).toBe('review');
    expect(t.controller.getState().draft).toMatchObject({
      start: '2026-11-18T15:00:00-05:00',
      scheduled: true,
    });
  });

  it('next weekday', async () => {
    const t = setup();
    await speak(t, 'Next Friday dinner with Priya');
    expect(tryAdd(t)).toBe(0);
    t.controller.chooseWeekday(1);
    expect(phase(t)).toBe('review');
    expect(t.controller.getState().draft?.date).toBe('2026-11-27');
  });

  it('midnight needs a time picked', async () => {
    const t = setup();
    await speak(t, 'Submit at midnight');
    expect(tryAdd(t)).toBe(0);
    t.controller.edit({ scheduled: true });
    expect(phase(t)).toBe('clarifying');
    t.controller.edit({ start: '2026-11-18T23:59:00-05:00' });
    expect(phase(t)).toBe('review');
  });

  it('time passed: keep today or move to tomorrow', async () => {
    const keep = setup();
    await speak(keep, 'Gym at 7 am');
    expect(tryAdd(keep)).toBe(0);
    keep.controller.keepToday();
    expect(phase(keep)).toBe('review');
    expect(keep.controller.getState().draft?.date).toBe('2026-11-18');

    const move = setup();
    await speak(move, 'Gym at 7 am');
    move.controller.moveToTomorrow();
    expect(phase(move)).toBe('review');
    expect(move.controller.getState().draft).toMatchObject({
      date: '2026-11-19',
      start: '2026-11-19T07:00:00-05:00',
    });
  });

  it.each(['Pay rent february 30', 'Pay rent next week'])(
    '"%s" needs a date picked',
    async (text) => {
      const t = setup();
      await speak(t, text);
      expect(tryAdd(t)).toBe(0);
      t.controller.markDatePicked();
      expect(phase(t)).toBe('review');
    },
  );

  it('title missing is resolved by typing a title', async () => {
    const t = setup();
    await speak(t, 'Tomorrow at 5 pm');
    expect(tryAdd(t)).toBe(0);
    t.controller.edit({ title: 'Call mom' });
    expect(phase(t)).toBe('review');
  });

  it('a time in a clock-change gap or fold is never guessed', async () => {
    const gap = setup({ now: () => new Date('2027-03-13T17:00:00.000Z') });
    await speak(gap, 'Flight check-in at 2:30 am', 'silence', '2027-03-14');
    expect(gap.controller.getState().clarifications.map((c) => c.kind)).toContain(
      'time_nonexistent',
    );
    expect(tryAdd(gap)).toBe(0);
    gap.controller.edit({ scheduled: true, start: '2027-03-14T03:30:00-04:00' });
    expect(phase(gap)).toBe('review');

    const fold = setup({ now: () => new Date('2027-11-06T17:00:00.000Z') });
    await speak(fold, 'Call at 1:30 am', 'silence', '2027-11-07');
    expect(fold.controller.getState().clarifications.map((c) => c.kind)).toContain(
      'time_ambiguous_offset',
    );
    expect(fold.controller.getState().draft?.start).toBe('');
    expect(tryAdd(fold)).toBe(0);
    fold.controller.chooseOffset(1);
    expect(phase(fold)).toBe('review');
    expect(fold.controller.getState().draft?.start).toBe('2027-11-07T01:30:00-05:00');
  });

  it('pendingClarifications ignores clarifications the edits already settled', async () => {
    const t = setup();
    await speak(t, 'Meeting at 3');
    expect(pendingClarifications(t.controller.getState())).toHaveLength(1);
    t.controller.edit({ scheduled: true, start: '2026-11-18T15:00:00-05:00' });
    expect(pendingClarifications(t.controller.getState())).toHaveLength(0);
  });
});

describe('edits are validated like the manual form (VX-08)', () => {
  it('an end before the start is an error and nothing is sent', async () => {
    const t = setup();
    await speak(t, 'Deep work 9 to 11 am tomorrow');
    t.controller.edit({ end: '2026-11-19T08:00:00-05:00' });
    t.controller.save();
    expect(t.create).not.toHaveBeenCalled();
    expect(t.controller.getState().fieldErrors.end).toBe(
      'Choose an end time later than the start.',
    );
    expect(phase(t)).toBe('review');
  });

  it('an empty title is an error', async () => {
    const t = setup();
    await speak(t, 'Call mom');
    t.controller.edit({ title: '   ' });
    t.controller.save();
    expect(t.create).not.toHaveBeenCalled();
    expect(t.controller.getState().fieldErrors.title).toBeDefined();
  });

  it('edits take effect in what is sent', async () => {
    const t = setup();
    await speak(t, 'Call mom tomorrow');
    t.controller.edit({ title: 'Call dad', priority: true });
    t.controller.save();
    await flush();
    expect(t.create.mock.calls[0]?.[1]).toMatchObject({
      title: 'Call dad',
      is_priority: true,
      scheduled_for_date: '2026-11-19',
    });
  });
});

describe('saving (VX-13..VX-16)', () => {
  it('cancel on the card writes nothing', async () => {
    const t = setup();
    await speak(t, 'Call mom tomorrow');
    t.controller.cancel();
    expect(phase(t)).toBe('discarded');
    expect(t.create).not.toHaveBeenCalled();
  });

  it('sends one voice request with the key frozen at Add, however many times Add is tapped', async () => {
    const t = setup();
    await speak(t, 'Call mom tomorrow');
    for (let i = 0; i < 5; i += 1) t.controller.save();
    await flush();
    expect(t.create).toHaveBeenCalledTimes(1);
    const [credential, body, key, options] = t.create.mock.calls[0]!;
    expect(credential).toBe('token');
    expect(body).toEqual({
      title: 'Call mom',
      scheduled_for_date: '2026-11-19',
      timezone: 'America/New_York',
      scheduled_start_at: null,
      scheduled_end_at: null,
      is_priority: false,
    });
    expect(key).toMatch(/^plan-/);
    expect(options).toEqual({ entrySource: 'voice', timeoutMs: 8000 });
  });

  it('success uses the server item, refreshes caches and says Added only after confirmation', async () => {
    const t = setup();
    await speak(t, 'Call mom tomorrow');
    t.controller.save();
    expect(phase(t)).toBe('saving');
    expect(t.announce).not.toHaveBeenCalledWith(expect.stringMatching(/confirmed|added|saved/i));
    await flush();
    expect(phase(t)).toBe('done');
    expect(t.onCreated).toHaveBeenCalledTimes(1);
    expect(t.controller.getState().savedItem?.scheduled_for_date).toBe('2026-11-19');
    expect(t.announce).toHaveBeenCalledWith('Plan item creation confirmed.');
  });

  it('replays an ambiguous failure after 1 s, 3 s and 9 s with the same key and body, then reports an unknown outcome', async () => {
    const t = setup();
    t.create.mockRejectedValue(new ApiError('timeout', 'The API request timed out.'));
    await speak(t, 'Call mom tomorrow');
    t.controller.save();
    await flush();
    expect(t.create).toHaveBeenCalledTimes(1);
    await jest.advanceTimersByTimeAsync(VOICE_LIMITS.replayDelaysMs[0] - 1);
    expect(t.create).toHaveBeenCalledTimes(1);
    await jest.advanceTimersByTimeAsync(1);
    expect(t.create).toHaveBeenCalledTimes(2);
    await jest.advanceTimersByTimeAsync(VOICE_LIMITS.replayDelaysMs[1]);
    expect(t.create).toHaveBeenCalledTimes(3);
    await jest.advanceTimersByTimeAsync(VOICE_LIMITS.replayDelaysMs[2]);
    expect(t.create).toHaveBeenCalledTimes(4);
    expect(phase(t)).toBe('unknown_outcome');
    const keys = new Set(t.create.mock.calls.map((call) => call[2]));
    const bodies = new Set(t.create.mock.calls.map((call) => JSON.stringify(call[1])));
    expect(keys.size).toBe(1);
    expect(bodies.size).toBe(1);
    expect(t.announce).toHaveBeenCalledWith(
      'Couldn’t confirm. Check Today before adding it again.',
    );
  });

  it.each([
    ['network', new ApiError('network', 'down')],
    ['5xx', new ApiError('http', 'bad', { status: 503 })],
    ['500', new ApiError('http', 'bad', { status: 500 })],
  ])('%s is ambiguous and replays', async (_name, error) => {
    const t = setup();
    t.create.mockRejectedValueOnce(error);
    await speak(t, 'Call mom tomorrow');
    t.controller.save();
    await flush();
    await jest.advanceTimersByTimeAsync(1000);
    expect(t.create).toHaveBeenCalledTimes(2);
    expect(t.create.mock.calls[1]?.[2]).toBe(t.create.mock.calls[0]?.[2]);
    expect(phase(t)).toBe('done');
  });

  it('Try again after an unknown outcome reuses the same key and body', async () => {
    const t = setup();
    t.create.mockRejectedValue(new ApiError('timeout', 'timeout'));
    await speak(t, 'Call mom tomorrow');
    t.controller.save();
    await jest.advanceTimersByTimeAsync(13_000);
    expect(phase(t)).toBe('unknown_outcome');
    const before = t.create.mock.calls.length;
    const key = t.create.mock.calls[0]?.[2];
    t.create.mockReset();
    t.create.mockResolvedValue(
      itemFixture({ title: 'Call mom', scheduled_for_date: '2026-11-19' }),
    );
    t.controller.retryUnknown();
    await flush();
    expect(before).toBe(4);
    expect(t.create).toHaveBeenCalledTimes(1);
    expect(t.create.mock.calls[0]?.[2]).toBe(key);
    expect(phase(t)).toBe('done');
  });

  it('blocks a new session while a save has an unknown outcome and cannot be cancelled away', async () => {
    const t = setup();
    t.create.mockRejectedValue(new ApiError('timeout', 'timeout'));
    await speak(t, 'Call mom tomorrow');
    t.controller.save();
    await jest.advanceTimersByTimeAsync(13_000);
    const id = t.controller.getState().sessionId;
    expect(t.controller.open('plan', '2026-12-01')).toBe('resumed');
    expect(t.controller.getState()).toMatchObject({ phase: 'unknown_outcome', sessionId: id });
    t.controller.cancel();
    t.controller.dismiss();
    expect(phase(t)).toBe('unknown_outcome');
    expect(t.native.start).toHaveBeenCalledTimes(1);
  });

  it('a 409 idempotency conflict is a generic error and never a new key', async () => {
    const t = setup();
    t.create.mockRejectedValue(
      new ApiError('http', 'conflict', { status: 409, code: 'plan_item_idempotency_conflict' }),
    );
    await speak(t, 'Call mom tomorrow');
    t.controller.save();
    await jest.advanceTimersByTimeAsync(20_000);
    expect(t.create).toHaveBeenCalledTimes(1);
    expect(t.controller.getState().failure).toEqual({ kind: 'save_conflict' });
  });

  it('a 401 discards the card and hands over to the session-expired flow', async () => {
    const t = setup();
    t.create.mockRejectedValue(new ApiError('http', 'no', { status: 401 }));
    await speak(t, 'Call mom tomorrow');
    t.controller.save();
    await flush();
    expect(phase(t)).toBe('discarded');
    expect(t.controller.getState().discardReason).toBe('unauthorized');
    expect(t.controller.getState().draft).toBeNull();
    expect(t.recover).toHaveBeenCalledTimes(1);
  });

  it('a 403 discards the card with the existing message', async () => {
    const t = setup();
    t.create.mockRejectedValue(new ApiError('http', 'no', { status: 403 }));
    await speak(t, 'Call mom tomorrow');
    t.controller.save();
    await flush();
    expect(phase(t)).toBe('discarded');
    expect(t.controller.getState().notice).toBe('Planning is unavailable for this account.');
    expect(t.recover).toHaveBeenCalledTimes(1);
  });

  it('a 422 goes back to the review card, keeping the edits and sending nothing more', async () => {
    const t = setup();
    t.create.mockRejectedValue(new ApiError('http', 'bad', { status: 422 }));
    await speak(t, 'Call mom tomorrow');
    t.controller.edit({ title: 'Call dad' });
    t.controller.save();
    await flush();
    expect(phase(t)).toBe('review');
    expect(t.controller.getState().draft?.title).toBe('Call dad');
    expect(t.controller.getState().notice).toBe(
      'Check the title, date and times. Nothing was added.',
    );
    expect(t.create).toHaveBeenCalledTimes(1);
  });

  it('offline: no request and the card stays', async () => {
    const t = setup({ connectivity: () => 'offline' });
    await speak(t, 'Call mom tomorrow');
    t.controller.save();
    expect(t.create).not.toHaveBeenCalled();
    expect(phase(t)).toBe('review');
    expect(t.controller.getState().notice).toMatch(/offline/i);
  });
});

describe('purge and expiry (VX-17..VX-19)', () => {
  it('sign-out purges the card, a pending save and the handoff', async () => {
    const t = setup();
    await speak(t, 'Call mom tomorrow');
    setVoicePrefill({ title: 'Call mom' });
    t.controller.purge();
    expect(t.controller.getState().phase).toBe('idle');
    expect(t.controller.getState().draft).toBeNull();
    expect(t.controller.getState().heard).toBe('');
    expect(takeVoicePrefill()).toBeUndefined();
  });

  it('purges an unknown outcome too when the account goes away', async () => {
    const t = setup();
    t.create.mockRejectedValue(new ApiError('timeout', 'timeout'));
    await speak(t, 'Call mom tomorrow');
    t.controller.save();
    await jest.advanceTimersByTimeAsync(13_000);
    t.controller.purge();
    expect(phase(t)).toBe('idle');
  });

  it('ignores a save result that arrives after the account changed', async () => {
    let resolve: (item: PlanItem) => void = () => undefined;
    const t = setup();
    t.create.mockImplementation(() => new Promise<PlanItem>((r) => (resolve = r)));
    await speak(t, 'Call mom tomorrow');
    t.controller.save();
    await flush();
    t.setCurrent(false);
    t.controller.purge();
    resolve(itemFixture());
    await flush();
    expect(phase(t)).toBe('idle');
    expect(t.onCreated).not.toHaveBeenCalled();
    expect(t.controller.getState().savedItem).toBeNull();
  });

  it('ignores listening results for a signed-out account', async () => {
    const t = setup();
    t.controller.open('today', '2026-11-18');
    await flush();
    t.emit.listening();
    t.setCurrent(false);
    t.emit.final('Call mom tomorrow');
    t.emit.end('silence');
    await jest.advanceTimersByTimeAsync(2000);
    expect(t.controller.getState().draft).toBeNull();
    expect(phase(t)).toBe('listening');
  });

  it('a signed-out account cannot open a session', () => {
    const t = setup();
    t.setCurrent(false);
    expect(t.controller.open('today', '2026-11-18')).toBe('ignored');
    expect(phase(t)).toBe('idle');
  });

  it('discards the card after 10 minutes without interaction', async () => {
    const t = setup();
    await speak(t, 'Call mom tomorrow');
    await jest.advanceTimersByTimeAsync(VOICE_LIMITS.idleExpiryMs - 1000);
    expect(phase(t)).toBe('review');
    await jest.advanceTimersByTimeAsync(1000);
    expect(phase(t)).toBe('discarded');
    expect(t.controller.getState().discardReason).toBe('idle_expired');
    expect(t.controller.getState().draft).toBeNull();
  });

  it('each interaction restarts the 10-minute clock', async () => {
    const t = setup();
    await speak(t, 'Call mom tomorrow');
    await jest.advanceTimersByTimeAsync(9 * 60_000);
    t.controller.edit({ title: 'Call dad' });
    await jest.advanceTimersByTimeAsync(9 * 60_000);
    expect(phase(t)).toBe('review');
    await jest.advanceTimersByTimeAsync(61_000);
    expect(phase(t)).toBe('discarded');
  });

  it('discards after 5 minutes in the background, and keeps the card for less', async () => {
    const long = setup();
    await speak(long, 'Call mom tomorrow');
    long.controller.appStateChanged('background');
    await jest.advanceTimersByTimeAsync(VOICE_LIMITS.backgroundExpiryMs);
    expect(phase(long)).toBe('discarded');
    expect(long.controller.getState().discardReason).toBe('background_expired');

    const short = setup();
    await speak(short, 'Call mom tomorrow');
    short.controller.appStateChanged('background');
    await jest.advanceTimersByTimeAsync(4 * 60_000);
    short.controller.appStateChanged('active');
    expect(phase(short)).toBe('review');
    await jest.advanceTimersByTimeAsync(2 * 60_000);
    expect(phase(short)).toBe('review');
  });

  it('checks the elapsed time when returning to the foreground even if the timer never ran', async () => {
    const t = setup();
    await speak(t, 'Call mom tomorrow');
    t.controller.appStateChanged('background');
    jest.setSystemTime(Date.now() + VOICE_LIMITS.backgroundExpiryMs + 1000);
    t.controller.appStateChanged('active');
    expect(phase(t)).toBe('discarded');
  });

  it('the permission prompt (inactive) does not start the 5-minute background clock', async () => {
    const t = setup();
    await speak(t, 'Call mom tomorrow');
    t.controller.appStateChanged('inactive');
    await jest.advanceTimersByTimeAsync(VOICE_LIMITS.backgroundExpiryMs + 1000);
    expect(phase(t)).toBe('review');
  });
});

describe('type it instead (VX-23)', () => {
  it('hands over what was understood', async () => {
    const t = setup();
    await speak(t, 'Workout tomorrow at 7 am');
    expect(t.controller.prefill()).toEqual({
      title: 'Workout',
      date: '2026-11-19',
      scheduled: true,
      start: '2026-11-19T07:00:00-05:00',
      end: '',
      priority: false,
    });
  });

  it('hands over the words for a multiple-request rejection but nothing for an unsupported action', async () => {
    const multiple = setup();
    await speak(multiple, 'Gym at 7 and dentist at 3');
    expect(multiple.controller.prefill()).toEqual({ title: 'Gym at 7 and dentist at 3' });
    const unsupported = setup();
    await speak(unsupported, 'Mark gym as done');
    expect(unsupported.controller.prefill()).toBeUndefined();
    const empty = setup();
    await speak(empty, ' ');
    expect(empty.controller.prefill()).toBeUndefined();
  });

  it('the handoff is one-shot and cleared on read', () => {
    setVoicePrefill({ title: 'Call mom' });
    expect(takeVoicePrefill()).toEqual({ title: 'Call mom' });
    expect(takeVoicePrefill()).toBeUndefined();
  });
});

describe('memory only and no content in logs (VX-18, D11, D15)', () => {
  it('writes no console output containing the sentence, the title or the words', async () => {
    const spies = (['log', 'info', 'warn', 'error', 'debug'] as const).map((method) =>
      jest.spyOn(console, method).mockImplementation(() => undefined),
    );
    const sentence = 'Zebra yoga tomorrow at 7 am';
    const t = setup();
    t.create.mockRejectedValueOnce(new ApiError('timeout', 'timeout'));
    await speak(t, sentence);
    t.controller.save();
    await jest.advanceTimersByTimeAsync(2000);
    t.controller.purge();
    const output = spies
      .flatMap((spy) => spy.mock.calls)
      .map((args) => args.map(String).join(' '))
      .join('\n');
    expect(output).not.toMatch(/zebra|yoga/i);
    for (const spy of spies) spy.mockRestore();
  });

  it('announcements never contain what was said', async () => {
    const t = setup();
    await speak(t, 'Zebra yoga tomorrow at 7 am');
    t.controller.save();
    await flush();
    const spoken = t.announce.mock.calls.map((call) => String(call[0])).join(' ');
    expect(spoken).not.toMatch(/zebra|yoga/i);
  });
});
