import { scanPriority } from './priority';
import { createScan } from './tokens';

describe('priority words', () => {
  it.each([
    ['urgent send invoice', [true, false, false]],
    ['high priority pay rent', [true, true, false, false]],
    ["it's urgent call mom", [true, true, false, false]],
    ['call mom important', [false, false, true]],
  ])('marks the priority words in "%s"', (text, used) => {
    const scan = createScan(text);
    expect(scanPriority(scan)).toBe(true);
    expect(scan.used).toEqual(used);
  });

  it('does nothing when there are none', () => {
    const scan = createScan('call mom');
    expect(scanPriority(scan)).toBe(false);
    expect(scan.used).toEqual([false, false]);
  });
});
