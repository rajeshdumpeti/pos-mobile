import { z } from 'zod';
import { ApiError } from '@/api';
import type { components } from '@/api/generated/schema';
import { isTimeZone } from '@/features/today/time';
type Schemas = components['schemas'];
export type InboxItem = Schemas['InboxItemResponse'];
export type InboxPage = Schemas['InboxListResponse'];
export type InboxFilter = InboxPage['filter'];
export type Unread = Schemas['InboxUnreadResponse'];
export type ReadResult = Schemas['InboxReadResponse'];
export type ReadAllResult = Schemas['InboxReadAllResponse'];
export type ZoneResult = Schemas['InboxTimezoneResponse'];
const instant = z.iso.datetime({ offset: true });
const zone = z.string().max(128).refine(isTimeZone);
const count = z.number().int().nonnegative().safe();
const source = z.enum(['all', 'today', 'plan']);
const version = z.literal('1.0');
const navigation = z
  .strictObject({
    state: z.enum(['available', 'unavailable']),
    action: z.enum(['today.view', 'plan_item.view']).nullable(),
    selected_date: z.iso.date().nullable(),
    plan_item_id: z.uuid().nullable(),
  })
  .refine((v) =>
    v.state === 'unavailable'
      ? v.action === null && v.selected_date === null && v.plan_item_id === null
      : v.selected_date !== null &&
        (v.action === 'today.view'
          ? v.plan_item_id === null
          : v.action === 'plan_item.view' && v.plan_item_id !== null),
  );
export const itemSchema: z.ZodType<InboxItem> = z
  .strictObject({
    notification_id: z.uuid(),
    source: z.enum(['today', 'plan']),
    category: z.enum(['reminder', 'attention']),
    event_type: z.enum(['plan.item_starting_soon', 'today.items_remaining']),
    title: z.string().min(1),
    message: z.string().min(1),
    created_at: instant,
    group: z.enum(['today', 'earlier']),
    is_read: z.boolean(),
    read_at: instant.nullable(),
    source_timezone: zone,
    navigation,
  })
  .refine(
    (v) =>
      v.is_read === (v.read_at !== null) &&
      (v.source === 'plan'
        ? v.event_type === 'plan.item_starting_soon'
        : v.event_type === 'today.items_remaining') &&
      (v.navigation.state === 'unavailable' ||
        v.navigation.action === (v.source === 'plan' ? 'plan_item.view' : 'today.view')),
  );
export const pageSchema: z.ZodType<InboxPage> = z
  .strictObject({
    contract_version: version,
    generated_at: instant,
    timezone: zone,
    filter: source,
    unread_count: count,
    items: z.array(itemSchema).max(100),
    next_cursor: z.string().min(1).max(1024).nullable(),
    has_more: z.boolean(),
  })
  .refine(
    (v) =>
      v.has_more === (v.next_cursor !== null) &&
      v.items.every((i) => v.filter === 'all' || i.source === v.filter),
  );
export const unreadSchema: z.ZodType<Unread> = z.strictObject({
  contract_version: version,
  source,
  unread_count: count,
  generated_at: instant,
});
export const readSchema: z.ZodType<ReadResult> = z.strictObject({
  contract_version: version,
  notification_id: z.uuid(),
  is_read: z.literal(true),
  read_at: instant,
  source: z.literal('all'),
  unread_count: count,
});
export const readAllSchema: z.ZodType<ReadAllResult> = z.strictObject({
  contract_version: version,
  source,
  marked_read_count: count,
  unread_count: count,
  read_at: instant,
});
export const zoneSchema: z.ZodType<ZoneResult> = z.strictObject({
  contract_version: version,
  timezone: zone,
  updated_at: instant,
  version: z.number().int().positive(),
});
export function validate<T>(
  schema: z.ZodType<T>,
  value: unknown,
  matches: (v: T) => boolean = () => true,
): T {
  const result = schema.safeParse(value);
  if (!result.success || !matches(result.data))
    throw new ApiError('invalidResponse', 'The notification response could not be verified.');
  return result.data;
}
