import {
  addDays,
  dateLabel,
  dayOfWeek,
  daysInMonth,
  formatYmd,
  isLeapYear,
  isValidYmd,
  parseYmd,
} from './calendar';
import type { Clarification } from './types';
import { consume, coreAt, matchWords, readNumberWord, type Scan } from './tokens';

export type Daypart = 'am' | 'pm';

type DatePhrase =
  | { kind: 'relative'; offset: number }
  | { kind: 'weekday'; weekday: number; next: boolean }
  | { kind: 'past' }
  | { kind: 'unsupported' }
  | { kind: 'absolute'; month: number; day: number; year: number | null }
  | { kind: 'ordinal'; day: number };

export type DateMatch = { phrase: DatePhrase; daypart: Daypart | null };

const WEEKDAYS: Record<string, number> = {
  sunday: 0,
  monday: 1,
  tuesday: 2,
  wednesday: 3,
  thursday: 4,
  friday: 5,
  saturday: 6,
};

const MONTHS: Record<string, number> = {
  january: 1,
  jan: 1,
  february: 2,
  feb: 2,
  march: 3,
  mar: 3,
  april: 4,
  apr: 4,
  may: 5,
  june: 6,
  jun: 6,
  july: 7,
  jul: 7,
  august: 8,
  aug: 8,
  september: 9,
  sep: 9,
  sept: 9,
  october: 10,
  oct: 10,
  november: 11,
  nov: 11,
  december: 12,
  dec: 12,
};

const DAYPARTS: Record<string, Daypart> = {
  morning: 'am',
  afternoon: 'pm',
  evening: 'pm',
  night: 'pm',
};

export function isWeekdayWord(word: string): boolean {
  return WEEKDAYS[word] !== undefined;
}

type Found = { phrase: DatePhrase; end: number; daypart?: Daypart };

function readDay(scan: Scan, index: number): { day: number; suffix: boolean } | null {
  const m = /^(\d{1,2})(st|nd|rd|th)?$/.exec(coreAt(scan, index));
  if (!m) return null;
  const day = Number(m[1]);
  return day >= 1 && day <= 31 ? { day, suffix: m[2] !== undefined } : null;
}

function readYear(scan: Scan, index: number): number | null {
  const m = /^((?:19|20|21)\d{2})$/.exec(coreAt(scan, index));
  return m ? Number(m[1]) : null;
}

function readCount(scan: Scan, index: number): { value: number; len: number } | null {
  const digits = /^\d{1,3}$/.exec(coreAt(scan, index));
  if (digits) return { value: Number(digits[0]), len: 1 };
  return readNumberWord(scan, index);
}

function matchPhraseAt(scan: Scan, i: number): Found | null {
  const t = coreAt(scan, i);
  if (t === '') return null;

  if (t === 'yesterday') return { phrase: { kind: 'past' }, end: i + 1 };
  if (t === 'today') return { phrase: { kind: 'relative', offset: 0 }, end: i + 1 };
  if (t === 'tonight')
    return { phrase: { kind: 'relative', offset: 0 }, end: i + 1, daypart: 'pm' };
  if (t === 'tomorrow') return { phrase: { kind: 'relative', offset: 1 }, end: i + 1 };
  if (matchWords(scan, i, ['day', 'after', 'tomorrow'])) {
    return { phrase: { kind: 'relative', offset: 2 }, end: i + 3 };
  }
  if (matchWords(scan, i, ['end', 'of', 'the', 'month'])) {
    return { phrase: { kind: 'unsupported' }, end: i + 4 };
  }

  if (t === 'last') {
    const next = coreAt(scan, i + 1);
    if (next === 'week' || WEEKDAYS[next] !== undefined) {
      return { phrase: { kind: 'past' }, end: i + 2 };
    }
    return null;
  }

  if (t === 'next') {
    const next = coreAt(scan, i + 1);
    if (next === 'week' || next === 'month' || next === 'weekend') {
      return { phrase: { kind: 'unsupported' }, end: i + 2 };
    }
    const weekday = WEEKDAYS[next];
    if (weekday !== undefined)
      return { phrase: { kind: 'weekday', weekday, next: true }, end: i + 2 };
    return null;
  }

  if (t === 'this') {
    const next = coreAt(scan, i + 1);
    if (next === 'weekend') return { phrase: { kind: 'unsupported' }, end: i + 2 };
    if (next === 'morning' || next === 'afternoon' || next === 'evening') {
      return {
        phrase: { kind: 'relative', offset: 0 },
        end: i + 2,
        daypart: DAYPARTS[next] ?? 'pm',
      };
    }
    const weekday = WEEKDAYS[next];
    if (weekday !== undefined)
      return { phrase: { kind: 'weekday', weekday, next: false }, end: i + 2 };
    return null;
  }

  if (t === 'in') {
    if (matchWords(scan, i, ['in', 'a', 'day'])) {
      return { phrase: { kind: 'relative', offset: 1 }, end: i + 3 };
    }
    if (matchWords(scan, i, ['in', 'a', 'week'])) {
      return { phrase: { kind: 'unsupported' }, end: i + 3 };
    }
    const count = readCount(scan, i + 1);
    if (count) {
      const unit = coreAt(scan, i + 1 + count.len);
      if ((unit === 'day' || unit === 'days') && count.value >= 1 && count.value <= 365) {
        return { phrase: { kind: 'relative', offset: count.value }, end: i + 2 + count.len };
      }
      if ((unit === 'week' || unit === 'weeks') && count.value >= 1) {
        return { phrase: { kind: 'unsupported' }, end: i + 2 + count.len };
      }
    }
    return null;
  }

  const weekday = WEEKDAYS[t];
  if (weekday !== undefined)
    return { phrase: { kind: 'weekday', weekday, next: false }, end: i + 1 };

  const month = MONTHS[t];
  if (month !== undefined) {
    const day = readDay(scan, i + 1);
    if (day) {
      const year = readYear(scan, i + 2);
      return {
        phrase: { kind: 'absolute', month, day: day.day, year },
        end: i + (year === null ? 2 : 3),
      };
    }
    return null;
  }

  // "[the] 21st of november [2027]" and "the 21st".
  const start = t === 'the' ? i + 1 : i;
  const day = readDay(scan, start);
  if (day) {
    const monthAfter = MONTHS[coreAt(scan, start + 2)];
    if (coreAt(scan, start + 1) === 'of' && monthAfter !== undefined) {
      const year = readYear(scan, start + 3);
      return {
        phrase: { kind: 'absolute', month: monthAfter, day: day.day, year },
        end: start + (year === null ? 3 : 4),
      };
    }
    if (t === 'the' && day.suffix)
      return { phrase: { kind: 'ordinal', day: day.day }, end: start + 1 };
  }
  return null;
}

/** Finds every date phrase, marks its tokens used and returns the matches in order. */
export function scanDates(scan: Scan, starts: number[] = []): DateMatch[] {
  const matches: DateMatch[] = [];
  for (let i = 0; i < scan.tokens.length; i += 1) {
    const found = matchPhraseAt(scan, i);
    if (!found) continue;

    let from = i;
    const before = coreAt(scan, i - 1);
    if (before === 'on') from = i - 1;
    else if (
      found.phrase.kind === 'relative' &&
      found.phrase.offset === 0 &&
      coreAt(scan, i) === 'today' &&
      (before === 'to' || before === 'for')
    ) {
      from = i - 1;
    }

    let end = found.end;
    let daypart = found.daypart ?? null;
    const tail = DAYPARTS[coreAt(scan, end)];
    if (tail !== undefined && daypart === null) {
      daypart = tail;
      end += 1;
    }
    consume(scan, from, end);
    starts.push(from);
    matches.push({ phrase: found.phrase, daypart });
    i = end - 1;
  }
  return matches;
}

/** Finds "in the morning", "at night" and similar; returns the first daypart found. */
export function scanLooseDaypart(scan: Scan): Daypart | null {
  let result: Daypart | null = null;
  for (let i = 0; i < scan.tokens.length; i += 1) {
    if (coreAt(scan, i) === 'in' && coreAt(scan, i + 1) === 'the') {
      const part = DAYPARTS[coreAt(scan, i + 2)];
      if (part !== undefined) {
        consume(scan, i, i + 3);
        result ??= part;
      }
    } else if (coreAt(scan, i) === 'at' && coreAt(scan, i + 1) === 'night') {
      consume(scan, i, i + 2);
      result ??= 'pm';
    }
  }
  return result;
}

export type ResolvedDate = {
  date: string;
  source: 'spoken' | 'context';
  clarification: Clarification | null;
  past: boolean;
};

/** Turns a date phrase into a date, relative to today in the device timezone. */
export function resolveDate(phrase: DatePhrase, today: string, contextDate: string): ResolvedDate {
  const spoken = (date: string, clarification: Clarification | null = null): ResolvedDate => ({
    date,
    source: 'spoken',
    clarification,
    past: false,
  });
  const fallback = (clarification: Clarification): ResolvedDate => ({
    date: contextDate,
    source: 'context',
    clarification,
    past: false,
  });

  switch (phrase.kind) {
    case 'past':
      return { date: contextDate, source: 'context', clarification: null, past: true };
    case 'unsupported':
      return fallback({ kind: 'date_unsupported' });
    case 'relative':
      return spoken(addDays(today, phrase.offset));
    case 'weekday': {
      const todayDow = dayOfWeek(today);
      let delta = (phrase.weekday - todayDow + 7) % 7;
      if (!phrase.next) return spoken(addDays(today, delta));
      if (delta === 0) delta = 7;
      const first = addDays(today, delta);
      const second = addDays(first, 7);
      return spoken(first, {
        kind: 'next_weekday',
        options: [
          { label: dateLabel(first), date: first },
          { label: dateLabel(second), date: second },
        ],
      });
    }
    case 'absolute': {
      const now = parseYmd(today);
      if (phrase.year !== null) {
        if (!isValidYmd(phrase.year, phrase.month, phrase.day)) {
          return fallback({ kind: 'date_invalid' });
        }
        const date = formatYmd(phrase.year, phrase.month, phrase.day);
        return date < today
          ? { date: contextDate, source: 'context', clarification: null, past: true }
          : spoken(date);
      }
      const longest = phrase.month === 2 ? 29 : daysInMonth(2001, phrase.month);
      if (phrase.day > longest) return fallback({ kind: 'date_invalid' });
      for (let year = now.year; year <= now.year + 8; year += 1) {
        if (!isValidYmd(year, phrase.month, phrase.day)) continue;
        if (phrase.month === 2 && phrase.day === 29 && !isLeapYear(year)) continue;
        const date = formatYmd(year, phrase.month, phrase.day);
        if (date >= today) return spoken(date);
      }
      return fallback({ kind: 'date_invalid' });
    }
    case 'ordinal': {
      const now = parseYmd(today);
      let { year, month } = now;
      if (phrase.day < now.day) {
        month += 1;
        if (month > 12) {
          month = 1;
          year += 1;
        }
      }
      if (!isValidYmd(year, month, phrase.day)) return fallback({ kind: 'date_invalid' });
      return spoken(formatYmd(year, month, phrase.day));
    }
  }
}
