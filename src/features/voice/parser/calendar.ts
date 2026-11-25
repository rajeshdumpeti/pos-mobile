/**
 * Pure calendar helpers on 'YYYY-MM-DD' strings plus Intl-based wall-clock lookups.
 * Nothing here reads the system clock or the device timezone.
 */

const DAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'] as const;
const MONTH_LABELS = [
  'Jan',
  'Feb',
  'Mar',
  'Apr',
  'May',
  'Jun',
  'Jul',
  'Aug',
  'Sep',
  'Oct',
  'Nov',
  'Dec',
] as const;

const pad2 = (n: number): string => String(n).padStart(2, '0');

export function formatYmd(year: number, month: number, day: number): string {
  return `${String(year).padStart(4, '0')}-${pad2(month)}-${pad2(day)}`;
}

export function parseYmd(value: string): { year: number; month: number; day: number } {
  const [y, m, d] = value.split('-');
  return { year: Number(y), month: Number(m), day: Number(d) };
}

export function isLeapYear(year: number): boolean {
  return (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0;
}

export function daysInMonth(year: number, month: number): number {
  if (month === 2) return isLeapYear(year) ? 29 : 28;
  return [4, 6, 9, 11].includes(month) ? 30 : 31;
}

export function isValidYmd(year: number, month: number, day: number): boolean {
  return month >= 1 && month <= 12 && day >= 1 && day <= daysInMonth(year, month);
}

export function addDays(value: string, days: number): string {
  const { year, month, day } = parseYmd(value);
  const date = new Date(Date.UTC(year, month - 1, day + days));
  return formatYmd(date.getUTCFullYear(), date.getUTCMonth() + 1, date.getUTCDate());
}

/** 0 = Sunday … 6 = Saturday. */
export function dayOfWeek(value: string): number {
  const { year, month, day } = parseYmd(value);
  return new Date(Date.UTC(year, month - 1, day)).getUTCDay();
}

/** Label such as "Fri, Nov 27". */
export function dateLabel(value: string): string {
  const { month, day } = parseYmd(value);
  return `${DAY_LABELS[dayOfWeek(value)] ?? ''}, ${MONTH_LABELS[month - 1] ?? ''} ${day}`;
}

export function formatHm(hour: number, minute: number): string {
  return `${pad2(hour)}:${pad2(minute)}`;
}

/** Label such as "7 AM" or "7:30 PM" from a 24-hour time. */
export function formatClockLabel(hour24: number, minute: number): string {
  const hour = hour24 % 12 === 0 ? 12 : hour24 % 12;
  const suffix = hour24 < 12 ? 'AM' : 'PM';
  return minute === 0 ? `${hour} ${suffix}` : `${hour}:${pad2(minute)} ${suffix}`;
}

type WallClock = {
  year: number;
  month: number;
  day: number;
  hour: number;
  minute: number;
  second: number;
};

const formatterCache = new Map<string, Intl.DateTimeFormat>();

function formatterFor(timezone: string): Intl.DateTimeFormat {
  const cached = formatterCache.get(timezone);
  if (cached) return cached;
  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone: timezone,
    hourCycle: 'h23',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
  formatterCache.set(timezone, formatter);
  return formatter;
}

/** Wall-clock fields of an instant in an IANA timezone. */
export function wallClockAt(epochMs: number, timezone: string): WallClock {
  const out: WallClock = { year: 0, month: 0, day: 0, hour: 0, minute: 0, second: 0 };
  for (const part of formatterFor(timezone).formatToParts(new Date(epochMs))) {
    const value = Number(part.value);
    if (part.type === 'year') out.year = value;
    else if (part.type === 'month') out.month = value;
    else if (part.type === 'day') out.day = value;
    else if (part.type === 'hour') out.hour = value === 24 ? 0 : value;
    else if (part.type === 'minute') out.minute = value;
    else if (part.type === 'second') out.second = value;
  }
  return out;
}

/** Local date ('YYYY-MM-DD') and time ('HH:MM') of an instant in a timezone. */
export function localDateTime(now: Date, timezone: string): { date: string; time: string } {
  const w = wallClockAt(now.getTime(), timezone);
  return { date: formatYmd(w.year, w.month, w.day), time: formatHm(w.hour, w.minute) };
}
