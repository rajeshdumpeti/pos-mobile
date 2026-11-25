import { coreAt, hasWordContent, matchWords, type Scan } from './tokens';

const COMPLETION_WORDS = new Set(['done', 'complete', 'completed', 'finished']);
const LIST_TARGETS = new Set(['list', 'plan', 'today', 'calendar']);

/** Core of a token regardless of whether another phrase already claimed it. */
function rawCore(scan: Scan, index: number): string {
  return scan.tokens[index]?.core ?? '';
}

function indexOfRaw(scan: Scan, from: number, word: string): number {
  for (let i = from; i < scan.tokens.length; i += 1) {
    if (rawCore(scan, i) === word) return i;
  }
  return -1;
}

/** True when nothing with letters or digits is left after normalization. */
export function isEmptyAfterNormalization(scan: Scan): boolean {
  return scan.tokens.every((token, i) => scan.used[i] === true || !hasWordContent(token.core));
}

/**
 * Explicit manipulation of existing items only. `phraseStarts` are the token indexes where
 * date and time phrases begin (for "move … to <date/time>").
 */
export function isUnsupportedAction(scan: Scan, phraseStarts: readonly number[]): boolean {
  const head = scan.tokens.findIndex(
    (token, i) => scan.used[i] !== true && hasWordContent(token.core),
  );
  if (head < 0) return false;

  switch (rawCore(scan, head)) {
    case 'reschedule':
    case 'edit':
      return true;
    case 'delete':
    case 'remove':
    case 'cancel':
      // Only when the sentence points at the list or an existing item of the person's own.
      return rawCore(scan, head + 1) === 'my' || mentionsListTarget(scan, head + 1);
    case 'mark':
      for (let i = head + 1; i < scan.tokens.length; i += 1) {
        if (COMPLETION_WORDS.has(rawCore(scan, i))) return true;
      }
      return false;
    case 'check':
      return rawCore(scan, head + 1) === 'off';
    case 'complete':
      return ['my', 'the'].includes(rawCore(scan, head + 1));
    case 'change':
      return indexOfRaw(scan, head + 1, 'to') >= 0;
    case 'move': {
      // Unsupported only when what follows "to" is itself a date or time phrase.
      const to = indexOfRaw(scan, head + 1, 'to');
      return to >= 0 && phraseStarts.some((start) => start === to || start === to + 1);
    }
    default:
      return false;
  }
}

/** "from my list|plan|today|calendar" (with "my" or "the" optional). */
function mentionsListTarget(scan: Scan, from: number): boolean {
  const at = indexOfRaw(scan, from, 'from');
  if (at < 0) return false;
  const target = ['my', 'the'].includes(rawCore(scan, at + 1)) ? at + 2 : at + 1;
  return LIST_TARGETS.has(rawCore(scan, target));
}

/** List markers that mean the person asked for more than one thing. */
export function hasListMarker(scan: Scan): boolean {
  for (let i = 0; i < scan.tokens.length; i += 1) {
    if (
      matchWords(scan, i, ['two', 'things']) ||
      matchWords(scan, i, ['and', 'also']) ||
      matchWords(scan, i, ['and', 'then']) ||
      matchWords(scan, i, ['as', 'well', 'as'])
    ) {
      return true;
    }
    if (coreAt(scan, i) === 'first') {
      for (let j = i + 1; j < scan.tokens.length; j += 1) {
        if (coreAt(scan, j) === 'then') return true;
      }
    }
  }
  return false;
}
