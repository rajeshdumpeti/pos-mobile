import { z } from 'zod';
export function validCalendarDate(value: unknown): value is string {
  return z.iso.date().safeParse(value).success;
}
/** Calendar arithmetic on date components, never a local instant plus 24 hours. */
export function adjacentDate(value: string, direction: -1 | 1): string {
  const date = new Date(`${value}T12:00:00Z`);
  date.setUTCDate(date.getUTCDate() + direction);
  return date.toISOString().slice(0, 10);
}
export type PlanContext = { origin: 'plan'; selectedDate: string };
export function planContext(origin: unknown, selectedDate: unknown): PlanContext | undefined {
  return origin === 'plan' && validCalendarDate(selectedDate)
    ? { origin, selectedDate }
    : undefined;
}
