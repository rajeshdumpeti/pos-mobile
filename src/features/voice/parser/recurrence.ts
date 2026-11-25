import { isWeekdayWord } from './date';
import { coreAt, type Scan } from './tokens';

const PERIODS = new Set([
  'day',
  'week',
  'month',
  'weekday',
  'morning',
  'afternoon',
  'evening',
  'night',
]);
const EACH_PERIODS = new Set(['day', 'week', 'month']);

/**
 * Finds recurrence wording ("every day", "every friday", "daily", "each week", …) as token
 * ranges [from, to). Recurrence is not supported in v1: the words stay in the title and the
 * parser still returns one proposal for the single date it resolves to.
 */
export function findRecurrence(scan: Scan): Array<[number, number]> {
  const ranges: Array<[number, number]> = [];
  for (let i = 0; i < scan.tokens.length; i += 1) {
    const word = coreAt(scan, i);
    if (word === 'daily' || word === 'weekly' || word === 'monthly') {
      ranges.push([i, i + 1]);
    } else if (word === 'every') {
      const next = coreAt(scan, i + 1);
      if (PERIODS.has(next) || isWeekdayWord(next)) ranges.push([i, i + 2]);
    } else if (word === 'each' && EACH_PERIODS.has(coreAt(scan, i + 1))) {
      ranges.push([i, i + 2]);
    }
  }
  return ranges;
}
