import { formatHm, parseYmd, wallClockAt } from './calendar';

const MINUTE_MS = 60_000;
const DAY_MS = 24 * 60 * MINUTE_MS;

/** UTC offset in minutes of a timezone at an instant (positive east of UTC). */
function offsetMinutesAt(epochMs: number, timezone: string): number {
  const w = wallClockAt(epochMs, timezone);
  const asUtc = Date.UTC(w.year, w.month - 1, w.day, w.hour, w.minute, w.second);
  return Math.round((asUtc - Math.floor(epochMs / 1000) * 1000) / MINUTE_MS);
}

export function formatOffset(minutes: number): string {
  const sign = minutes < 0 ? '-' : '+';
  const abs = Math.abs(minutes);
  return `${sign}${formatHm(Math.floor(abs / 60), abs % 60)}`;
}

export type LocalTimeStatus =
  { kind: 'ok' } | { kind: 'nonexistent' } | { kind: 'ambiguous'; offsets: [string, string] };

/**
 * Checks whether a local wall time exists once, never (spring-forward gap) or twice
 * (fall-back overlap) on a date in a timezone. Uses Intl only.
 */
export function classifyLocalTime(date: string, time: string, timezone: string): LocalTimeStatus {
  const { year, month, day } = parseYmd(date);
  const [hh, mm] = time.split(':');
  const hour = Number(hh);
  const minute = Number(mm);
  const guess = Date.UTC(year, month - 1, day, hour, minute);

  const candidateOffsets = new Set([
    offsetMinutesAt(guess - DAY_MS, timezone),
    offsetMinutesAt(guess + DAY_MS, timezone),
  ]);

  const valid: Array<{ instant: number; offset: number }> = [];
  for (const offset of candidateOffsets) {
    const instant = guess - offset * MINUTE_MS;
    if (offsetMinutesAt(instant, timezone) === offset) valid.push({ instant, offset });
  }
  valid.sort((a, b) => a.instant - b.instant);

  const first = valid[0];
  const second = valid[1];
  if (!first) return { kind: 'nonexistent' };
  if (second)
    return {
      kind: 'ambiguous',
      offsets: [formatOffset(first.offset), formatOffset(second.offset)],
    };
  return { kind: 'ok' };
}
