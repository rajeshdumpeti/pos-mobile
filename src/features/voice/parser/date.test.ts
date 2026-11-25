import { resolveDate, scanDates, scanLooseDaypart } from './date';
import { createScan } from './tokens';

const TODAY = '2026-11-18'; // Wednesday

function resolveFirst(text: string, today = TODAY) {
  const matches = scanDates(createScan(text));
  const first = matches[0];
  if (!first) throw new Error('no date phrase');
  return resolveDate(first.phrase, today, today);
}

describe('date phrases', () => {
  it('finds one phrase and its daypart', () => {
    const scan = createScan('call mom tomorrow evening');
    const matches = scanDates(scan);
    expect(matches).toHaveLength(1);
    expect(matches[0]?.daypart).toBe('pm');
    expect(scan.used).toEqual([false, false, true, true]);
  });

  it('consumes "on" and "to/for today" with the phrase', () => {
    const on = createScan('dentist on friday');
    scanDates(on);
    expect(on.used).toEqual([false, true, true]);
    const forToday = createScan('buy milk for today');
    scanDates(forToday);
    expect(forToday.used).toEqual([false, false, true, true]);
  });

  it('does not treat a month name without a day as a date', () => {
    expect(scanDates(createScan('i may call mom in may'))).toHaveLength(0);
  });

  it('resolves relative dates from today in the timezone', () => {
    expect(resolveFirst('x tomorrow').date).toBe('2026-11-19');
    expect(resolveFirst('x day after tomorrow').date).toBe('2026-11-20');
    expect(resolveFirst('x in 3 days').date).toBe('2026-11-21');
    expect(resolveFirst('x in a day').date).toBe('2026-11-19');
    expect(resolveFirst('x in 365 days').date).toBe('2027-11-18');
  });

  it('does not match day counts outside 1 to 365', () => {
    expect(scanDates(createScan('x in 0 days'))).toHaveLength(0);
    expect(scanDates(createScan('x in 366 days'))).toHaveLength(0);
  });

  it('counts today when the weekday is today and offers two options for next', () => {
    expect(resolveFirst('gym wednesday').date).toBe(TODAY);
    const next = resolveFirst('gym next wednesday');
    expect(next.date).toBe('2026-11-25');
    expect(next.clarification).toEqual({
      kind: 'next_weekday',
      options: [
        { label: 'Wed, Nov 25', date: '2026-11-25' },
        { label: 'Wed, Dec 2', date: '2026-12-02' },
      ],
    });
  });

  it('resolves absolute dates to the next occurrence and flags impossible ones', () => {
    expect(resolveFirst('x november 21').date).toBe('2026-11-21');
    expect(resolveFirst('x november 17').date).toBe('2027-11-17');
    expect(resolveFirst('x feb 29').date).toBe('2028-02-29');
    expect(resolveFirst('x february 30').clarification).toEqual({ kind: 'date_invalid' });
    expect(resolveFirst('x february 29 2027').clarification).toEqual({ kind: 'date_invalid' });
    expect(resolveFirst('x the 31st').clarification).toEqual({ kind: 'date_invalid' });
  });

  it('treats explicit past dates as past', () => {
    expect(resolveFirst('x november 17 2026').past).toBe(true);
    expect(resolveFirst('x november 18 2026').past).toBe(false);
    expect(resolveFirst('x yesterday').past).toBe(true);
    expect(resolveFirst('x last friday').past).toBe(true);
  });

  it('marks unsupported ranges of time', () => {
    for (const phrase of [
      'next week',
      'this weekend',
      'next month',
      'end of the month',
      'in 2 weeks',
    ]) {
      expect(resolveFirst(`x ${phrase}`).clarification).toEqual({ kind: 'date_unsupported' });
    }
  });

  it('finds loose dayparts', () => {
    const scan = createScan('call at 7 in the morning');
    expect(scanLooseDaypart(scan)).toBe('am');
    expect(scan.used.slice(3)).toEqual([true, true, true]);
    expect(scanLooseDaypart(createScan('movie at night'))).toBe('pm');
    expect(scanLooseDaypart(createScan('call mom'))).toBeNull();
  });
});
