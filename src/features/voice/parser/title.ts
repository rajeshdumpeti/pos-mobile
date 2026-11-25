import type { Hint } from './types';
import { type Scan } from './tokens';

const MAX_TITLE_LENGTH = 200;

const LEAD_INS: ReadonlyArray<readonly string[]> = [
  ['can', 'you', 'add'],
  ['could', 'you', 'add'],
  ['remind', 'me', 'to'],
  ["don't", 'forget', 'to'],
  ["i've", 'got', 'to'],
  ['i', 'need', 'to'],
  ['i', 'have', 'to'],
  ['make', 'a', 'task'],
  ['remind', 'me'],
  ['i', 'gotta'],
  ['new', 'task'],
  ['create'],
  ['schedule'],
  ['add'],
  ['put'],
  ['plan'],
];

const TRAILERS: ReadonlyArray<readonly string[]> = [
  ['to', 'my', 'calendar'],
  ['on', 'my', 'calendar'],
  ['to', 'my', 'list'],
  ['to', 'the', 'list'],
  ['to', 'my', 'plan'],
  ['to', 'the', 'plan'],
  ['for', 'today'],
  ['to', 'today'],
];

const DANGLING = new Set(['at', 'on', 'for', 'by', 'to']);

type Word = { raw: string; core: string };

function startsWith(words: Word[], phrase: readonly string[]): boolean {
  return phrase.every((part, i) => words[i]?.core === part);
}

function endsWith(words: Word[], phrase: readonly string[]): boolean {
  const offset = words.length - phrase.length;
  return offset >= 0 && phrase.every((part, i) => words[offset + i]?.core === part);
}

function isPunctuationOnly(word: Word): boolean {
  return !/[A-Za-z0-9\u00C0-\u024F]/.test(word.raw);
}

/** Builds the title from tokens no other phrase claimed. */
export function buildTitle(scan: Scan): { title: string; hints: Hint[] } {
  let words: Word[] = scan.tokens.filter((_, i) => !scan.used[i]);

  let changed = true;
  while (changed) {
    changed = false;
    const lead = LEAD_INS.find((phrase) => startsWith(words, phrase));
    if (lead) {
      words = words.slice(lead.length);
      changed = true;
    }
    const trailer = TRAILERS.find((phrase) => endsWith(words, phrase));
    if (trailer) {
      words = words.slice(0, words.length - trailer.length);
      changed = true;
    }
    const last = words[words.length - 1];
    if (last && (DANGLING.has(last.core) || isPunctuationOnly(last))) {
      words = words.slice(0, -1);
      changed = true;
    }
    const first = words[0];
    if (first && isPunctuationOnly(first)) {
      words = words.slice(1);
      changed = true;
    }
  }

  let title = words
    .map((word) => word.raw)
    .join(' ')
    .replace(/^[\s.,;:!?\-–—]+/, '')
    .replace(/[\s.,;:!?\-–—]+$/, '')
    .replace(/\s+/g, ' ');

  const hints: Hint[] = [];
  if (title.length > MAX_TITLE_LENGTH) {
    let cut = title.slice(0, MAX_TITLE_LENGTH);
    if (title[MAX_TITLE_LENGTH] !== ' ') {
      const space = cut.lastIndexOf(' ');
      if (space > 0) cut = cut.slice(0, space);
    }
    title = cut.trim();
    hints.push('title_truncated');
  }

  return { title: title.charAt(0).toUpperCase() + title.slice(1), hints };
}
