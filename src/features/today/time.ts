/** IANA resolution uses platform Intl; server local_date owns dashboard eligibility. */
export function isTimeZone(value: string): boolean {
  if (!value || value.length > 128 || /^[+-]|^(?:UTC|GMT)[+-]/i.test(value)) return false;
  try {
    new Intl.DateTimeFormat('en', { timeZone: value }).format(0);
    return true;
  } catch {
    return false;
  }
}
export function resolveTimeZone(): string | undefined {
  const value = Intl.DateTimeFormat().resolvedOptions().timeZone;
  return typeof value === 'string' && isTimeZone(value) ? value : undefined;
}
export function localDate(now: Date, timezone: string): string {
  const parts = new Intl.DateTimeFormat('en', {
    timeZone: timezone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(now);
  const value = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find((part) => part.type === type)?.value;
  return `${value('year')}-${value('month')}-${value('day')}`;
}
export function boundaryMarker(now: Date, zone: string | undefined): string {
  return zone ? `${zone}:${localDate(now, zone)}` : 'timezone-unavailable';
}
export function formatInstant(value: string, timezone: string): string {
  return new Intl.DateTimeFormat(undefined, {
    timeZone: timezone,
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    timeZoneName: 'short',
  }).format(new Date(value));
}
/** Check offset at the specified absolute instant, including both DST folds. */
export function timestampMatchesZone(value: string, zone: string): boolean {
  if (!isTimeZone(zone)) return false;
  const match = /^(\d{4}-\d{2}-\d{2})T(\d{2}):(\d{2}):(\d{2})(?:\.\d+)?(Z|[+-]\d{2}:\d{2})$/.exec(
    value,
  );
  if (!match || !Number.isFinite(Date.parse(value))) return false;
  const date = new Date(value);
  const parts = new Intl.DateTimeFormat('en-GB', {
    timeZone: zone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hourCycle: 'h23',
  }).formatToParts(date);
  const part = (type: Intl.DateTimeFormatPartTypes) => parts.find((p) => p.type === type)?.value;
  return (
    `${part('year')}-${part('month')}-${part('day')}` === match[1] &&
    part('hour') === match[2] &&
    part('minute') === match[3] &&
    part('second') === match[4]
  );
}
/** Offset representation for editing preserves the actual instant, not a guessed wall time. */
export function timestampInZone(value: string, zone: string): string {
  const instant = new Date(value);
  const parts = new Intl.DateTimeFormat('en-GB', {
    timeZone: zone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hourCycle: 'h23',
  }).formatToParts(instant);
  const part = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find((p) => p.type === type)?.value ?? '';
  const wall = `${part('year')}-${part('month')}-${part('day')}T${part('hour')}:${part('minute')}:${part('second')}`;
  const offset = Math.round(
    (Date.parse(`${wall}Z`) - Math.floor(instant.getTime() / 1000) * 1000) / 60000,
  );
  const absolute = Math.abs(offset);
  const suffix = `${offset < 0 ? '-' : '+'}${String(Math.floor(absolute / 60)).padStart(2, '0')}:${String(absolute % 60).padStart(2, '0')}`;
  const fraction = /\.(\d+)(?:Z|[+-]\d{2}:\d{2})$/.exec(value)?.[1];
  return wall + (fraction ? `.${fraction}` : '') + suffix;
}
