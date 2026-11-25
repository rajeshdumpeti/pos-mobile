import {
  addDays,
  dateLabel,
  dayOfWeek,
  daysInMonth,
  formatClockLabel,
  isValidYmd,
  localDateTime,
} from './calendar';

describe('calendar helpers', () => {
  it('adds days across month and year boundaries', () => {
    expect(addDays('2026-11-18', 3)).toBe('2026-11-21');
    expect(addDays('2026-12-30', 3)).toBe('2027-01-02');
    expect(addDays('2028-02-28', 1)).toBe('2028-02-29');
    expect(addDays('2027-02-28', 1)).toBe('2027-03-01');
    expect(addDays('2026-11-18', -18)).toBe('2026-10-31');
  });

  it('knows weekdays and labels', () => {
    expect(dayOfWeek('2026-11-18')).toBe(3);
    expect(dateLabel('2026-11-27')).toBe('Fri, Nov 27');
  });

  it('validates days per month including leap years', () => {
    expect(daysInMonth(2028, 2)).toBe(29);
    expect(daysInMonth(2027, 2)).toBe(28);
    expect(isValidYmd(2026, 4, 31)).toBe(false);
    expect(isValidYmd(2028, 2, 29)).toBe(true);
    expect(isValidYmd(2027, 2, 29)).toBe(false);
    expect(isValidYmd(2026, 13, 1)).toBe(false);
  });

  it('formats clock labels', () => {
    expect(formatClockLabel(7, 0)).toBe('7 AM');
    expect(formatClockLabel(19, 30)).toBe('7:30 PM');
    expect(formatClockLabel(0, 0)).toBe('12 AM');
    expect(formatClockLabel(12, 5)).toBe('12:05 PM');
  });

  it('reads the local date and time of an instant in a timezone', () => {
    const instant = new Date('2026-11-19T03:00:00.000Z');
    expect(localDateTime(instant, 'America/New_York')).toEqual({
      date: '2026-11-18',
      time: '22:00',
    });
    expect(localDateTime(instant, 'Asia/Kolkata')).toEqual({ date: '2026-11-19', time: '08:30' });
    expect(localDateTime(new Date('2026-11-19T00:00:00.000Z'), 'UTC')).toEqual({
      date: '2026-11-19',
      time: '00:00',
    });
  });
});
