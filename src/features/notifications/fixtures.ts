// Synthetic test data only; never imported by runtime modules.
import type { InboxItem, InboxPage } from './contracts';
export const notificationId = '11111111-1111-4111-8111-111111111111';
export const planId = '22222222-2222-4222-8222-222222222222';
export const instant = '2026-10-31T12:00:00Z';
export const itemFixture = (patch: Partial<InboxItem> = {}): InboxItem => ({
  notification_id: notificationId,
  source: 'plan',
  category: 'reminder',
  event_type: 'plan.item_starting_soon',
  title: 'Plan starts soon',
  message: 'Your scheduled item starts soon.',
  created_at: instant,
  group: 'earlier',
  is_read: false,
  read_at: null,
  source_timezone: 'UTC',
  navigation: {
    state: 'available',
    action: 'plan_item.view',
    selected_date: '2026-10-31',
    plan_item_id: planId,
  },
  ...patch,
});
export const pageFixture = (patch: Partial<InboxPage> = {}): InboxPage => ({
  contract_version: '1.0',
  generated_at: instant,
  timezone: 'UTC',
  filter: 'all',
  unread_count: 101,
  items: [itemFixture()],
  next_cursor: null,
  has_more: false,
  ...patch,
});
