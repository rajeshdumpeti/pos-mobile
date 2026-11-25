import { scanDuration } from './duration';
import { createScan } from './tokens';

describe('durations', () => {
  it.each([
    ['for 45 minutes', 45],
    ['for an hour', 60],
    ['for 2 hours', 120],
    ['for an hour and a half', 90],
    ['for 1.5 hours', 90],
    ['for 90 minutes', 90],
    ['for two hours', 120],
    ['for forty-five minutes', 45],
    ['for 2 hours and a half', 150],
  ])('reads "%s"', (text, minutes) => {
    const scan = createScan(`run ${text} today`);
    expect(scanDuration(scan)).toBe(minutes);
    expect(scan.used.filter(Boolean).length).toBeGreaterThanOrEqual(3);
  });

  it('ignores "for" without an amount and unit', () => {
    expect(scanDuration(createScan('pay for today'))).toBeNull();
    expect(scanDuration(createScan('wait for 3 apples'))).toBeNull();
    expect(scanDuration(createScan('for 0 minutes'))).toBeNull();
  });
});
