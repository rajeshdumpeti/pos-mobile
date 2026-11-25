import { hasListMarker, isEmptyAfterNormalization, isUnsupportedAction } from './rejections';
import { createScan } from './tokens';

const unsupported = (text: string, starts: number[] = []) =>
  isUnsupportedAction(createScan(text), starts);

describe('rejection detection', () => {
  it('detects empty input', () => {
    expect(isEmptyAfterNormalization(createScan(''))).toBe(true);
    expect(isEmptyAfterNormalization(createScan('... ?'))).toBe(true);
    expect(isEmptyAfterNormalization(createScan('call mom'))).toBe(false);
  });

  it.each([
    'mark gym as done',
    'check off milk',
    'delete gym',
    'remove milk from my list',
    'cancel gym from my plan',
    'reschedule dentist',
    'edit gym',
    'complete my gym task',
    'change gym to 7 pm',
  ])('rejects "%s"', (text) => {
    expect(unsupported(text)).toBe(true);
  });

  it('rejects move only when a date or time follows "to"', () => {
    expect(unsupported('move gym to tomorrow', [3])).toBe(true);
    expect(unsupported('move the couch to the garage')).toBe(false);
  });

  it.each([
    'cancel gym membership',
    'finish report',
    'complete tax form',
    'change oil',
    'mark my calendar',
  ])('keeps "%s" as a normal task', (text) => {
    expect(unsupported(text)).toBe(false);
  });

  it('detects list markers but not "bread and milk"', () => {
    expect(hasListMarker(createScan('two things pay rent'))).toBe(true);
    expect(hasListMarker(createScan('call mom and also dad'))).toBe(true);
    expect(hasListMarker(createScan('call mom and then dad'))).toBe(true);
    expect(hasListMarker(createScan('pay rent as well as bills'))).toBe(true);
    expect(hasListMarker(createScan('first wash then dry'))).toBe(true);
    expect(hasListMarker(createScan('buy bread and milk'))).toBe(false);
    expect(hasListMarker(createScan('then first wash'))).toBe(false);
  });
});
