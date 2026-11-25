/**
 * Tokenizer and shared scanning helpers. A token keeps its raw text (for the title) and a
 * normalized lowercase core (for matching). A `used` mask records tokens claimed by a phrase.
 */

export type Token = { raw: string; core: string };

export type Scan = { tokens: Token[]; used: boolean[] };

function toCore(raw: string): string {
  let core = raw.toLowerCase().replace(/[’‘]/g, "'");
  core = core.replace(/^[("“[]+/, '').replace(/[.,;:!?)"”\]]+$/, '');
  const meridiem = /^([ap])\.m$/.exec(core);
  if (meridiem) core = `${meridiem[1] ?? ''}m`;
  return core;
}

export function tokenize(text: string): Token[] {
  return text
    .split(/\s+/)
    .filter((piece) => piece.length > 0)
    .map((raw) => ({ raw, core: toCore(raw) }));
}

export function createScan(text: string): Scan {
  const tokens = tokenize(text);
  return { tokens, used: tokens.map(() => false) };
}

/** Core of a token, or '' when the index is out of range or the token is already used. */
export function coreAt(scan: Scan, index: number): string {
  if (index < 0 || index >= scan.tokens.length || scan.used[index]) return '';
  return scan.tokens[index]?.core ?? '';
}

export function matchWords(scan: Scan, index: number, words: readonly string[]): boolean {
  return words.every((word, offset) => coreAt(scan, index + offset) === word);
}

export function consume(scan: Scan, from: number, to: number): void {
  for (let i = from; i < to; i += 1) scan.used[i] = true;
}

export function hasWordContent(core: string): boolean {
  return /[a-z0-9]/.test(core);
}

const SMALL_NUMBERS: Record<string, number> = {
  zero: 0,
  one: 1,
  two: 2,
  three: 3,
  four: 4,
  five: 5,
  six: 6,
  seven: 7,
  eight: 8,
  nine: 9,
  ten: 10,
  eleven: 11,
  twelve: 12,
  thirteen: 13,
  fourteen: 14,
  fifteen: 15,
  sixteen: 16,
  seventeen: 17,
  eighteen: 18,
  nineteen: 19,
};

const TENS: Record<string, number> = {
  twenty: 20,
  thirty: 30,
  forty: 40,
  fifty: 50,
  sixty: 60,
  seventy: 70,
  eighty: 80,
  ninety: 90,
};

/** Reads a spoken number (zero–ninety-nine) such as "seven", "twenty three" or "forty-five". */
export function readNumberWord(scan: Scan, index: number): { value: number; len: number } | null {
  const word = coreAt(scan, index);
  if (word === '') return null;

  const hyphen = /^([a-z]+)-([a-z]+)$/.exec(word);
  if (hyphen) {
    const tens = TENS[hyphen[1] ?? ''];
    const ones = SMALL_NUMBERS[hyphen[2] ?? ''];
    if (tens !== undefined && ones !== undefined && ones >= 1 && ones <= 9) {
      return { value: tens + ones, len: 1 };
    }
    return null;
  }

  const small = SMALL_NUMBERS[word];
  if (small !== undefined) return { value: small, len: 1 };

  const tens = TENS[word];
  if (tens !== undefined) {
    const ones = SMALL_NUMBERS[coreAt(scan, index + 1)];
    if (ones !== undefined && ones >= 1 && ones <= 9) return { value: tens + ones, len: 2 };
    return { value: tens, len: 1 };
  }
  return null;
}
