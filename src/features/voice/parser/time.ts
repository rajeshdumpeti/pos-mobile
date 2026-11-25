import { formatClockLabel, formatHm } from './calendar';
import type { Daypart } from './date';
import type { MeridiemOption } from './types';
import { consume, coreAt, readNumberWord, type Scan } from './tokens';

type Meridiem = 'am' | 'pm';

/** A clock reading as spoken, before any meridiem decision. */
export type Clock = { hour: number; minute: number; meridiem: Meridiem | null; colon: boolean };

export type TimeMatch =
  | { kind: 'noon' }
  | { kind: 'midnight' }
  | { kind: 'clock'; clock: Clock }
  | { kind: 'range'; start: Clock; end: Clock };

const PREFIX_WORDS = new Set(['from', 'between']);
const RANGE_JOINERS = new Set(['to', 'until', 'till', '-', '–']);
const MINUTE_WORDS = new Set([15, 30, 45]);

function readMeridiem(scan: Scan, index: number): { meridiem: Meridiem; len: number } | null {
  const word = coreAt(scan, index);
  if (word === 'am' || word === 'pm') return { meridiem: word, len: 1 };
  if ((word === 'a' || word === 'p') && coreAt(scan, index + 1) === 'm') {
    return { meridiem: word === 'a' ? 'am' : 'pm', len: 2 };
  }
  return null;
}

function readClock(scan: Scan, index: number): { clock: Clock; len: number } | null {
  const word = coreAt(scan, index);
  if (word === '') return null;

  let hour: number;
  let minute = 0;
  let len = 1;
  let colon = false;
  let meridiem: Meridiem | null = null;

  const withColon = /^(\d{1,2}):(\d{2})(am|pm)?$/.exec(word);
  const glued = /^(\d{1,2})(am|pm)$/.exec(word);
  if (withColon) {
    hour = Number(withColon[1]);
    minute = Number(withColon[2]);
    colon = true;
    meridiem = (withColon[3] as Meridiem | undefined) ?? null;
  } else if (glued) {
    hour = Number(glued[1]);
    meridiem = glued[2] as Meridiem;
  } else if (/^\d{1,2}$/.test(word)) {
    hour = Number(word);
  } else {
    const spoken = readNumberWord(scan, index);
    if (!spoken || spoken.value < 1 || spoken.value > 23) return null;
    hour = spoken.value;
    len = spoken.len;
    const minuteWord = readNumberWord(scan, index + len);
    if (minuteWord && MINUTE_WORDS.has(minuteWord.value)) {
      minute = minuteWord.value;
      len += minuteWord.len;
    }
  }

  if (meridiem === null) {
    const next = coreAt(scan, index + len);
    if (next === "o'clock" || next === 'oclock') len += 1;
    const spokenMeridiem = readMeridiem(scan, index + len);
    if (spokenMeridiem) {
      meridiem = spokenMeridiem.meridiem;
      len += spokenMeridiem.len;
    }
  }

  if (minute > 59) return null;
  if (meridiem !== null) {
    if (hour < 1 || hour > 12) return null;
  } else if (hour > 23 || (hour === 0 && !colon)) {
    return null;
  }
  return { clock: { hour, minute, meridiem, colon }, len };
}

/** A bare reading ("at 7", "7:30") with no meridiem and a 12-hour value. */
function isBare(clock: Clock): boolean {
  return clock.meridiem === null && clock.hour >= 1 && clock.hour <= 12;
}

function needsAt(clock: Clock): boolean {
  return clock.meridiem === null && !clock.colon;
}

type Found = { match: TimeMatch; end: number };

function readRange(scan: Scan, index: number, prefixed: boolean, between: boolean): Found | null {
  const gluedRange = /^(\d{1,2})(?::(\d{2}))?-(\d{1,2})(?::(\d{2}))?(am|pm)?$/.exec(
    coreAt(scan, index),
  );
  if (gluedRange) {
    let meridiem = (gluedRange[5] as Meridiem | undefined) ?? null;
    let len = 1;
    if (meridiem === null) {
      const spoken = readMeridiem(scan, index + 1);
      if (spoken) {
        meridiem = spoken.meridiem;
        len += spoken.len;
      }
    }
    if (meridiem === null && !prefixed) return null;
    const start: Clock = {
      hour: Number(gluedRange[1]),
      minute: Number(gluedRange[2] ?? 0),
      meridiem: null,
      colon: gluedRange[2] !== undefined,
    };
    const end: Clock = {
      hour: Number(gluedRange[3]),
      minute: Number(gluedRange[4] ?? 0),
      meridiem,
      colon: gluedRange[4] !== undefined,
    };
    if (start.hour < 1 || start.hour > 12 || end.hour < 1 || end.hour > 12) return null;
    return { match: { kind: 'range', start, end }, end: index + len };
  }

  const first = readClock(scan, index);
  if (!first) return null;
  const joiner = coreAt(scan, index + first.len);
  if (!(RANGE_JOINERS.has(joiner) || (between && joiner === 'and'))) return null;
  const second = readClock(scan, index + first.len + 1);
  if (!second) return null;
  if (!prefixed && first.clock.meridiem === null && second.clock.meridiem === null) return null;
  return {
    match: { kind: 'range', start: first.clock, end: second.clock },
    end: index + first.len + 1 + second.len,
  };
}

function readTimeAt(scan: Scan, i: number): Found | null {
  let j = i;
  let hasAt = false;
  if (coreAt(scan, j) === 'at') {
    hasAt = true;
    j += 1;
  }

  const prefix = coreAt(scan, j);
  if (PREFIX_WORDS.has(prefix)) {
    return readRange(scan, j + 1, true, prefix === 'between');
  }

  const range = readRange(scan, j, false, false);
  if (range) return range;

  const word = coreAt(scan, j);
  if (word === 'noon' || word === 'midday') return { match: { kind: 'noon' }, end: j + 1 };
  if (word === 'midnight') return { match: { kind: 'midnight' }, end: j + 1 };

  const single = readClock(scan, j);
  if (!single) return null;
  if (needsAt(single.clock) && !hasAt) return null;
  return { match: { kind: 'clock', clock: single.clock }, end: j + single.len };
}

/** Finds every time phrase, marks its tokens used and returns the matches in order. */
export function scanTimes(scan: Scan, starts: number[] = []): TimeMatch[] {
  const matches: TimeMatch[] = [];
  for (let i = 0; i < scan.tokens.length; i += 1) {
    const found = readTimeAt(scan, i);
    if (!found) continue;
    consume(scan, i, found.end);
    starts.push(i);
    matches.push(found.match);
    i = found.end - 1;
  }
  return matches;
}

export type TimeResolution =
  | { kind: 'none' }
  | { kind: 'midnight' }
  | { kind: 'exact'; start: string; end: string | null; startMinutes: number }
  | { kind: 'meridiem'; options: MeridiemOption[] };

function to24(hour: number, meridiem: Meridiem): number {
  if (hour > 12) return hour;
  if (meridiem === 'am') return hour === 12 ? 0 : hour;
  return hour === 12 ? 12 : hour + 12;
}

function exactFor(clock: Clock, daypart: Daypart | null): number | null {
  if (clock.meridiem !== null) return to24(clock.hour, clock.meridiem);
  if (clock.hour >= 13 || clock.hour === 0) return clock.hour;
  if (clock.hour === 12) return null;
  return daypart === null ? null : to24(clock.hour, daypart);
}

function hm(hour: number, minute: number): string {
  return formatHm(hour, minute);
}

export function resolveTime(match: TimeMatch | null, daypart: Daypart | null): TimeResolution {
  if (match === null) return { kind: 'none' };
  if (match.kind === 'midnight') return { kind: 'midnight' };
  if (match.kind === 'noon') return exact(12, 0, null);

  if (match.kind === 'clock') {
    const { clock } = match;
    const hour = exactFor(clock, daypart);
    if (hour !== null) return exact(hour, clock.minute, null);
    if (!isBare(clock)) return { kind: 'none' };
    return {
      kind: 'meridiem',
      options: (['am', 'pm'] as const).map((meridiem) => {
        const h = to24(clock.hour, meridiem);
        return {
          label: formatClockLabel(h, clock.minute),
          startTime: hm(h, clock.minute),
          endTime: null,
        };
      }),
    };
  }

  return resolveRange(match.start, match.end, daypart);
}

function exact(hour: number, minute: number, endMinutes: number | null): TimeResolution {
  return {
    kind: 'exact',
    start: hm(hour, minute),
    end: endMinutes === null ? null : hm(Math.floor(endMinutes / 60), endMinutes % 60),
    startMinutes: hour * 60 + minute,
  };
}

function resolveRange(start: Clock, end: Clock, daypart: Daypart | null): TimeResolution {
  const startMin = (h: number, c: Clock): number => h * 60 + c.minute;

  // Explicit 24-hour readings need no meridiem.
  const startHour24 = start.hour >= 13 || start.hour === 0;
  const endHour24 = end.hour >= 13 || end.hour === 0;
  const stated = start.meridiem ?? end.meridiem ?? daypart;

  const hourFor = (
    clock: Clock,
    own: Meridiem | null,
    borrowed: Meridiem | null,
  ): number | null => {
    if (clock.hour >= 13 || clock.hour === 0) return clock.hour;
    const meridiem = own ?? borrowed;
    return meridiem === null ? null : to24(clock.hour, meridiem);
  };

  if (startHour24 || endHour24 || stated !== null) {
    const borrowedStart = end.meridiem ?? daypart ?? (endHour24 && end.hour >= 12 ? 'pm' : null);
    const borrowedEnd =
      start.meridiem ?? daypart ?? (startHour24 && start.hour >= 12 ? 'pm' : null);
    const s = hourFor(start, start.meridiem, borrowedStart);
    const e = hourFor(end, end.meridiem, borrowedEnd);
    if (s !== null && e !== null) {
      if (startMin(s, start) < startMin(e, end)) return exact(s, start.minute, startMin(e, end));
      // Same meridiem for both does not fit: read the start as the other half of the day.
      if (start.meridiem === null && end.meridiem !== null) {
        const flipped = to24(start.hour, end.meridiem === 'pm' ? 'am' : 'pm');
        if (startMin(flipped, start) < startMin(e, end)) {
          return exact(flipped, start.minute, startMin(e, end));
        }
      }
      return exact(s, start.minute, null);
    }
  }

  const options: MeridiemOption[] = [];
  for (const meridiem of ['am', 'pm'] as const) {
    const s = to24(start.hour, meridiem);
    const e = to24(end.hour, meridiem);
    if (startMin(s, start) < startMin(e, end)) {
      options.push({
        label: `${formatClockLabel(s, start.minute)} – ${formatClockLabel(e, end.minute)}`,
        startTime: hm(s, start.minute),
        endTime: hm(e, end.minute),
      });
    }
  }
  if (options.length === 2) return { kind: 'meridiem', options };
  // Neither half of the day fits both ends ("11 to 1"): read it as morning into afternoon.
  const s = to24(start.hour, 'am');
  const e = to24(end.hour, 'pm');
  return exact(s, start.minute, startMin(e, end));
}
