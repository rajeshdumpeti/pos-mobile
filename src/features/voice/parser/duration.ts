import { consume, coreAt, matchWords, readNumberWord, type Scan } from './tokens';

const MINUTE_UNITS = new Set(['minute', 'minutes', 'min', 'mins']);
const HOUR_UNITS = new Set(['hour', 'hours', 'hr', 'hrs']);

/** Finds "for <amount> <unit>" and returns the duration in minutes (null when absent). */
export function scanDuration(scan: Scan): number | null {
  for (let i = 0; i < scan.tokens.length; i += 1) {
    if (coreAt(scan, i) !== 'for') continue;
    const found = readDuration(scan, i + 1);
    if (found) {
      consume(scan, i, found.end);
      return found.minutes;
    }
  }
  return null;
}

function readDuration(scan: Scan, start: number): { minutes: number; end: number } | null {
  let value: number;
  let next: number;

  const article = coreAt(scan, start);
  if (article === 'a' || article === 'an') {
    value = 1;
    next = start + 1;
  } else {
    const digits = /^\d+(?:\.\d+)?$/.exec(article);
    if (digits) {
      value = Number(article);
      next = start + 1;
    } else {
      const word = readNumberWord(scan, start);
      if (!word) return null;
      value = word.value;
      next = start + word.len;
    }
  }

  const unit = coreAt(scan, next);
  let minutes: number;
  if (HOUR_UNITS.has(unit)) {
    minutes = Math.round(value * 60);
    next += 1;
    if (matchWords(scan, next, ['and', 'a', 'half'])) {
      minutes += 30;
      next += 3;
    }
  } else if (MINUTE_UNITS.has(unit)) {
    minutes = Math.round(value);
    next += 1;
  } else {
    return null;
  }
  return minutes > 0 ? { minutes, end: next } : null;
}
