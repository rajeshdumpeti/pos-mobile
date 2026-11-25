import { classifyLocalTime, formatOffset } from './dst';

describe('DST classification', () => {
  it('finds the spring-forward gap in New York', () => {
    expect(classifyLocalTime('2027-03-14', '02:30', 'America/New_York')).toEqual({
      kind: 'nonexistent',
    });
    expect(classifyLocalTime('2027-03-14', '01:59', 'America/New_York')).toEqual({ kind: 'ok' });
    expect(classifyLocalTime('2027-03-14', '03:00', 'America/New_York')).toEqual({ kind: 'ok' });
  });

  it('finds the fall-back overlap with offsets in time order', () => {
    expect(classifyLocalTime('2027-11-07', '01:30', 'America/New_York')).toEqual({
      kind: 'ambiguous',
      offsets: ['-04:00', '-05:00'],
    });
    expect(classifyLocalTime('2027-11-07', '02:00', 'America/New_York')).toEqual({ kind: 'ok' });
    expect(classifyLocalTime('2027-10-31', '01:15', 'Europe/London')).toEqual({
      kind: 'ambiguous',
      offsets: ['+01:00', '+00:00'],
    });
  });

  it('treats zones without DST as always ok', () => {
    expect(classifyLocalTime('2027-03-14', '02:30', 'Asia/Kolkata')).toEqual({ kind: 'ok' });
    expect(classifyLocalTime('2027-11-07', '01:30', 'UTC')).toEqual({ kind: 'ok' });
  });

  it('formats offsets', () => {
    expect(formatOffset(-240)).toBe('-04:00');
    expect(formatOffset(330)).toBe('+05:30');
    expect(formatOffset(0)).toBe('+00:00');
  });
});
