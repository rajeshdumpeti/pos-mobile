import { resolveTime, scanTimes } from './time';
import { createScan } from './tokens';

function first(text: string) {
  const matches = scanTimes(createScan(text));
  return matches[0] ?? null;
}

describe('time phrases', () => {
  it('requires "at" for a bare number', () => {
    expect(first('gym 7')).toBeNull();
    expect(first('gym at 7')).not.toBeNull();
    expect(first('gym 7 pm')).not.toBeNull();
    expect(first('gym 7:30')).not.toBeNull();
  });

  it('does not treat counts as times', () => {
    expect(first('buy 3 apples')).toBeNull();
    expect(first('read for 45 minutes')).toBeNull();
    expect(first('bring 5 to 10 people')).toBeNull();
  });

  it('resolves explicit meridiems and 24-hour times exactly', () => {
    expect(resolveTime(first('at 7 am'), null)).toMatchObject({ kind: 'exact', start: '07:00' });
    expect(resolveTime(first('at 12 am'), null)).toMatchObject({ start: '00:00' });
    expect(resolveTime(first('at 12:30 pm'), null)).toMatchObject({ start: '12:30' });
    expect(resolveTime(first('at 17'), null)).toMatchObject({ start: '17:00' });
    expect(resolveTime(first('at 0:30'), null)).toMatchObject({ start: '00:30' });
    expect(resolveTime(first('at noon'), null)).toMatchObject({ start: '12:00' });
  });

  it('asks about midnight and bare hours', () => {
    expect(resolveTime(first('at midnight'), null)).toEqual({ kind: 'midnight' });
    expect(resolveTime(first('at 3'), null)).toMatchObject({
      kind: 'meridiem',
      options: [
        { label: '3 AM', startTime: '03:00' },
        { label: '3 PM', startTime: '15:00' },
      ],
    });
    expect(resolveTime(first('at 12'), 'am')).toMatchObject({ kind: 'meridiem' });
  });

  it('lets a daypart decide a bare hour', () => {
    expect(resolveTime(first('at 7'), 'am')).toMatchObject({ kind: 'exact', start: '07:00' });
    expect(resolveTime(first('at 7'), 'pm')).toMatchObject({ kind: 'exact', start: '19:00' });
    expect(resolveTime(first('at 7 am'), 'pm')).toMatchObject({ start: '07:00' });
  });

  it('reads spoken hours and minutes', () => {
    expect(resolveTime(first('at seven thirty pm'), null)).toMatchObject({ start: '19:30' });
    expect(resolveTime(first("at seven o'clock in"), null)).toMatchObject({ kind: 'meridiem' });
  });

  it('applies one stated meridiem to both ends of a range', () => {
    expect(resolveTime(first('from 9 to 11 am'), null)).toMatchObject({
      start: '09:00',
      end: '11:00',
    });
    expect(resolveTime(first('9-11am'), null)).toMatchObject({ start: '09:00', end: '11:00' });
    expect(resolveTime(first('between 2 and 4 pm'), null)).toMatchObject({
      start: '14:00',
      end: '16:00',
    });
    expect(resolveTime(first('from 9 to 11'), 'pm')).toMatchObject({
      start: '21:00',
      end: '23:00',
    });
  });

  it('asks about a bare range with both interpretations', () => {
    expect(resolveTime(first('from 9 to 11'), null)).toEqual({
      kind: 'meridiem',
      options: [
        { label: '9 AM – 11 AM', startTime: '09:00', endTime: '11:00' },
        { label: '9 PM – 11 PM', startTime: '21:00', endTime: '23:00' },
      ],
    });
  });

  it('keeps the end after the start', () => {
    expect(resolveTime(first('from 10 pm to 9 pm'), null)).toMatchObject({
      start: '22:00',
      end: null,
    });
  });
});
