import { consume, matchWords, type Scan } from './tokens';

const PHRASES: ReadonlyArray<readonly string[]> = [
  ['high', 'priority'],
  ['top', 'priority'],
  ["it's", 'urgent'],
  ['urgent'],
  ['important'],
  ['priority'],
];

/** Marks priority words as used and returns whether any were found. */
export function scanPriority(scan: Scan): boolean {
  let found = false;
  for (let i = 0; i < scan.tokens.length; i += 1) {
    for (const phrase of PHRASES) {
      if (matchWords(scan, i, phrase)) {
        consume(scan, i, i + phrase.length);
        found = true;
        break;
      }
    }
  }
  return found;
}
