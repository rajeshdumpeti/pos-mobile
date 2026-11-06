import type { InboxItem, InboxPage } from './contracts';
import { localDate } from '@/features/today/time';
export const inboxRoot = ['notification-inbox'] as const;
export const inboxKeys = {
  account: (account: string) => [...inboxRoot, account] as const,
  count: (account: string) => [...inboxRoot, account, 'count'] as const,
  list: (account: string, source: string, zone: string) =>
    [...inboxRoot, account, 'list', source, zone] as const,
};
export function uniqueItems(pages: InboxPage[]): InboxItem[] {
  const seen = new Set<string>();
  return pages.flatMap((p) =>
    p.items.filter((i) => {
      if (seen.has(i.notification_id)) return false;
      seen.add(i.notification_id);
      return true;
    }),
  );
}
export function nextCursor(last: InboxPage, used: (string | undefined)[]) {
  return last.has_more && last.next_cursor && !used.includes(last.next_cursor)
    ? last.next_cursor
    : undefined;
}
export function badgeText(count: number) {
  return count === 0 ? undefined : count > 99 ? '99+' : String(count);
}
export function destination(item: InboxItem, zone: string, now = new Date()) {
  const nav = item.navigation;
  if (nav.state !== 'available') return { kind: 'unavailable' } as const;
  if (nav.action === 'plan_item.view' && nav.plan_item_id && nav.selected_date)
    return { kind: 'plan', id: nav.plan_item_id, date: nav.selected_date } as const;
  if (nav.action === 'today.view' && nav.selected_date === localDate(now, zone))
    return { kind: 'today' } as const;
  return { kind: 'historicalToday' } as const;
}
export function inboxFailure(error: unknown) {
  // Only fixed frontend copy and the transport's sanitized support ID leave this boundary.
  if (error instanceof Error && 'category' in error && error.category === 'network')
    return 'You’re offline. Confirmed notifications may be out of date.';
  return 'We couldn’t update notifications. Try again.';
}
export function createTimezoneSync() {
  let confirmed: string | undefined;
  let pending: Promise<void> | undefined;
  return async (zone: string, send: (zone: string) => Promise<unknown>, current: () => boolean) => {
    if (pending) {
      await pending;
      if (!current()) return;
    }
    if (confirmed === zone || !current()) return;
    const operation = send(zone).then(() => {
      if (current()) confirmed = zone;
    });
    pending = operation;
    try {
      await operation;
    } finally {
      if (pending === operation) pending = undefined;
    }
  };
}
