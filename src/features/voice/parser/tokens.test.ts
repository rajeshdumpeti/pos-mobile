import { createScan, readNumberWord, tokenize } from './tokens';

describe('tokenizer', () => {
  it('normalizes cores without changing raw text', () => {
    const tokens = tokenize('  Call   MOM, at 7 a.m. I’ve   ');
    expect(tokens.map((t) => t.raw)).toEqual(['Call', 'MOM,', 'at', '7', 'a.m.', 'I’ve']);
    expect(tokens.map((t) => t.core)).toEqual(['call', 'mom', 'at', '7', 'am', "i've"]);
  });

  it('gives punctuation-only tokens an empty core', () => {
    expect(tokenize('... ?').map((t) => t.core)).toEqual(['', '']);
    expect(tokenize('').length).toBe(0);
  });
});

describe('spoken numbers', () => {
  const read = (text: string) => readNumberWord(createScan(text), 0);

  it('reads one to nineteen and tens', () => {
    expect(read('seven')).toEqual({ value: 7, len: 1 });
    expect(read('thirteen')).toEqual({ value: 13, len: 1 });
    expect(read('thirty')).toEqual({ value: 30, len: 1 });
  });

  it('reads compounds written with a hyphen or a space', () => {
    expect(read('forty-five')).toEqual({ value: 45, len: 1 });
    expect(read('twenty three')).toEqual({ value: 23, len: 2 });
  });

  it('rejects other words', () => {
    expect(read('banana')).toBeNull();
    expect(read('twenty-banana')).toBeNull();
  });
});
