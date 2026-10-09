import { isTimeZone, localDate, timestampInZone, timestampMatchesZone } from './time';
/** Display only. Eligibility and Today local_date still come from the server. */
export function friendlyDate(
  date: string,
  zone: string,
  today = localDate(new Date(), zone),
): string {
  if (date === today) return 'Today';
  const tomorrow = new Date(`${today}T12:00:00Z`);
  tomorrow.setUTCDate(tomorrow.getUTCDate() + 1);
  if (date === tomorrow.toISOString().slice(0, 10)) return 'Tomorrow';
  return new Intl.DateTimeFormat(undefined, {
    timeZone: 'UTC',
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  }).format(new Date(`${date}T12:00:00Z`));
}
export function friendlyTime(value: string, zone: string): string {
  return new Intl.DateTimeFormat(undefined, {
    timeZone: zone,
    hour: 'numeric',
    minute: '2-digit',
  }).format(new Date(value));
}
export function friendlyCompletion(value: string, zone: string): string {
  return new Intl.DateTimeFormat(undefined, {
    timeZone: zone,
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  }).format(new Date(value));
}
export function friendlyZone(zone: string, instant = new Date()): string {
  return (
    new Intl.DateTimeFormat(undefined, { timeZone: zone, timeZoneName: 'longGeneric' })
      .formatToParts(instant)
      .find((p) => p.type === 'timeZoneName')?.value ?? 'Local time'
  );
}
export function wallClock(value: Date, zone: string): string {
  const parts = new Intl.DateTimeFormat('en-GB', {
    timeZone: zone,
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  }).formatToParts(value);
  return `${parts.find((p) => p.type === 'hour')?.value}:${parts.find((p) => p.type === 'minute')?.value}`;
}
/** Enumerate actual instants. Gaps have zero matches, folds have two; never guess a fold. */
export function wallTimeCandidates(date: string, clock: string, zone: string): string[] {
  if (!isTimeZone(zone) || !/^\d{4}-\d{2}-\d{2}$/.test(date) || !/^\d{2}:\d{2}$/.test(clock))
    return [];
  const wall = `${date}T${clock}:00`;
  const nominal = Date.parse(`${wall}Z`);
  if (!Number.isFinite(nominal)) return [];
  const offsets = new Set<string>();
  for (const hours of [-36, -12, 0, 12, 36]) {
    const offset = timestampInZone(new Date(nominal + hours * 3600000).toISOString(), zone).slice(
      -6,
    );
    offsets.add(offset);
  }
  return [...offsets]
    .map((offset) => wall + offset)
    .filter((value) => timestampMatchesZone(value, zone))
    .sort((a, b) => Date.parse(a) - Date.parse(b));
}
export function pickerDate(date: string, zone: string): Date {
  const candidate = wallTimeCandidates(date, '12:00', zone)[0];
  return candidate ? new Date(candidate) : new Date();
}
