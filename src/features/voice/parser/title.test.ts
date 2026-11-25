import { buildTitle } from './title';
import { consume, createScan } from './tokens';

const title = (text: string) => buildTitle(createScan(text));

describe('title building', () => {
  it('strips lead-ins, trailers and dangling words', () => {
    expect(title('Add buy milk to my list').title).toBe('Buy milk');
    expect(title('Remind me to call mom').title).toBe('Call mom');
    expect(title('call mom at').title).toBe('Call mom');
    expect(title('Can you add clean the kitchen to the plan').title).toBe('Clean the kitchen');
  });

  it('keeps original casing apart from the first letter', () => {
    expect(title('call MOM').title).toBe('Call MOM');
    expect(title('CALL MOM').title).toBe('CALL MOM');
  });

  it('keeps inner punctuation, drops outer punctuation', () => {
    expect(title('buy bread, milk.').title).toBe('Buy bread, milk');
    expect(title('- call mom -').title).toBe('Call mom');
  });

  it('skips tokens other phrases already used', () => {
    const scan = createScan('call mom tomorrow at 5');
    consume(scan, 2, 5);
    expect(buildTitle(scan).title).toBe('Call mom');
  });

  it('returns an empty title when nothing is left', () => {
    expect(title('add').title).toBe('');
    expect(title('').title).toBe('');
  });

  it('cuts at the last word boundary within 200 characters and says so', () => {
    const words = Array(60).fill('apples').join(' ');
    const result = title(words);
    expect(result.title.length).toBeLessThanOrEqual(200);
    expect(result.title.endsWith('apples')).toBe(true);
    expect(result.hints).toEqual(['title_truncated']);
    expect(title('x'.repeat(200)).hints).toEqual([]);
    expect(title('x'.repeat(201)).title.length).toBe(200);
  });
});
