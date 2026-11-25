import { addDays, localDateTime } from './calendar';
import { resolveDate, scanDates, scanLooseDaypart, type Daypart } from './date';
import { classifyLocalTime } from './dst';
import { scanDuration } from './duration';
import { scanPriority } from './priority';
import { hasListMarker, isEmptyAfterNormalization, isUnsupportedAction } from './rejections';
import { resolveTime, scanTimes, type TimeResolution } from './time';
import { buildTitle } from './title';
import { createScan, type Scan } from './tokens';
import {
  VOICE_GRAMMAR_VERSION,
  type Clarification,
  type Hint,
  type ParseInput,
  type ParseResult,
  type RejectionReason,
} from './types';

const FILLERS = new Set(['um', 'uh', 'er', 'hmm']);
const LEADING_POLITE = new Set(['please', 'okay', 'ok', 'hey']);

function reject(reason: RejectionReason): ParseResult {
  return { kind: 'rejection', reason, grammarVersion: VOICE_GRAMMAR_VERSION };
}

function removeFillers(scan: Scan): void {
  scan.tokens.forEach((token, i) => {
    if (FILLERS.has(token.core)) scan.used[i] = true;
  });
  for (let i = 0; i < scan.tokens.length; i += 1) {
    const word = scan.tokens[i]?.core ?? '';
    if (!LEADING_POLITE.has(word) && !FILLERS.has(word)) break;
    scan.used[i] = true;
  }
}

function minutesOf(time: string): number {
  const [h, m] = time.split(':');
  return Number(h) * 60 + Number(m);
}

function addMinutes(time: string, minutes: number): string | null {
  const total = minutesOf(time) + minutes;
  if (total >= 24 * 60) return null;
  return `${String(Math.floor(total / 60)).padStart(2, '0')}:${String(total % 60).padStart(2, '0')}`;
}

/** Turns one recognized sentence into one proposal, a clarification or a rejection. */
export function parseVoiceInput(input: ParseInput): ParseResult {
  const scan = createScan(input.text);
  removeFillers(scan);
  if (isEmptyAfterNormalization(scan)) return reject('empty');

  const isPriority = scanPriority(scan);
  const durationMinutes = scanDuration(scan);

  const now = localDateTime(input.now, input.timezone);
  const phraseStarts: number[] = [];
  const dateMatches = scanDates(scan, phraseStarts);
  const looseDaypart = scanLooseDaypart(scan);
  const timeMatches = scanTimes(scan, phraseStarts);

  if (isUnsupportedAction(scan, phraseStarts)) {
    return reject('unsupported_action');
  }
  if (hasListMarker(scan) || dateMatches.length > 1 || timeMatches.length > 1) {
    return reject('multiple_requests');
  }

  const dateMatch = dateMatches[0] ?? null;
  const timeMatch = timeMatches[0] ?? null;
  const daypart: Daypart | null = dateMatch?.daypart ?? looseDaypart;

  const clarifications: Clarification[] = [];
  const hints: Hint[] = [];

  // Date
  let date = input.contextDate;
  let dateSource: 'spoken' | 'context' = 'context';
  let dateClarification: Clarification | null = null;
  if (dateMatch) {
    const resolved = resolveDate(dateMatch.phrase, now.date, input.contextDate);
    if (resolved.past) return reject('past_date');
    date = resolved.date;
    dateSource = resolved.source;
    dateClarification = resolved.clarification;
  }

  // Time
  const time: TimeResolution = resolveTime(timeMatch, daypart);
  let startTime: string | null = null;
  let endTime: string | null = null;
  const isRange = timeMatch?.kind === 'range';

  if (time.kind === 'midnight') {
    clarifications.push({ kind: 'midnight' });
  } else if (time.kind === 'meridiem') {
    const options = time.options.map((option) => ({
      ...option,
      endTime:
        option.endTime ??
        (durationMinutes !== null && !isRange
          ? addMinutes(option.startTime, durationMinutes)
          : null),
    }));
    clarifications.push({ kind: 'meridiem', options });
    if (time.endDropped) hints.push('end_after_midnight_dropped');
  } else if (time.kind === 'exact') {
    startTime = time.start;
    endTime = time.end;
    if (time.endDropped) hints.push('end_after_midnight_dropped');
    if (endTime === null && durationMinutes !== null && !isRange) {
      endTime = addMinutes(startTime, durationMinutes);
      if (endTime === null) hints.push('end_after_midnight_dropped');
    }
  } else if (durationMinutes !== null) {
    hints.push('duration_without_start_ignored');
  }

  if (dateClarification) clarifications.push(dateClarification);

  // Past and DST checks on an exact start time.
  if (startTime !== null) {
    if (date === now.date && startTime < now.time) {
      clarifications.push({
        kind: 'time_passed',
        options: [
          { label: 'Keep today', date: now.date },
          { label: 'Move to tomorrow', date: addDays(now.date, 1) },
        ],
      });
    }
    const status = classifyLocalTime(date, startTime, input.timezone);
    if (status.kind === 'nonexistent') {
      startTime = null;
      endTime = null;
      clarifications.push({ kind: 'time_nonexistent' });
    } else if (status.kind === 'ambiguous') {
      clarifications.push({
        kind: 'time_ambiguous_offset',
        options: status.offsets.map((offset) => ({ label: `UTC${offset}`, offset })),
      });
    }
  }

  const built = buildTitle(scan);
  if (built.title === '') clarifications.push({ kind: 'title_missing' });
  hints.push(...built.hints);

  return {
    kind: 'proposal',
    proposal: { title: built.title, date, dateSource, startTime, endTime, isPriority },
    clarifications,
    hints,
    grammarVersion: VOICE_GRAMMAR_VERSION,
  };
}
