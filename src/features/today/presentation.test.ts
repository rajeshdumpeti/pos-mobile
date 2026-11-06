import { friendlyDate, friendlyTime, wallTimeCandidates } from './presentation';
import { timestampMatchesZone } from './time';
test('friendly dates use actual calendar facts and Today remains only a display label', () => {
  expect(friendlyDate('2026-10-02', 'America/New_York', '2026-10-02')).toBe('Today');
  expect(friendlyDate('2026-10-03', 'America/New_York', '2026-10-02')).toBe('Tomorrow');
  expect(friendlyDate('2026-10-07', 'America/New_York', '2026-10-02')).toBe('Wed, Oct 7');
  expect(friendlyTime('2026-10-02T22:30:00Z', 'America/New_York')).toBe('6:30 PM');
});
test.each([
  ['2026-03-08', '02:30', 'America/New_York', 0],
  ['2026-11-01', '01:30', 'America/New_York', 2],
  ['2026-10-25', '02:30', 'Europe/Paris', 2],
  ['2026-10-02', '18:30', 'Asia/Kathmandu', 1],
  ['2026-10-02', '18:30', 'Australia/Lord_Howe', 1],
] as const)('native wall intent %s %s in %s has %i valid choices', (date, time, zone, count) => {
  const matches = wallTimeCandidates(date, time, zone);
  expect(matches).toHaveLength(count);
  expect(matches.every((value) => timestampMatchesZone(value, zone))).toBe(true);
});
