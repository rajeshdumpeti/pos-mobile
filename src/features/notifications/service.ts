import type { HttpRequest } from '@/api/client';
import { ApiError } from '@/api';
import {
  validate,
  pageSchema,
  unreadSchema,
  readSchema,
  readAllSchema,
  zoneSchema,
  type InboxFilter,
} from './contracts';
type Request = <R, B = never>(input: HttpRequest<B>) => Promise<R>;
export function createInboxService(request: Request) {
  return {
    list: async (
      credential: string,
      source: InboxFilter,
      timezone: string,
      cursor?: string,
      signal?: AbortSignal,
    ) =>
      validate(
        pageSchema,
        await request<unknown>({
          path: '/api/v1/notifications',
          method: 'GET',
          credential,
          query: { source, timezone, limit: 50, ...(cursor ? { cursor } : {}) },
          signal,
          expectedStatuses: [200],
        }),
        (v) => v.filter === source && v.timezone === timezone,
      ),
    count: async (credential: string, signal?: AbortSignal) =>
      validate(
        unreadSchema,
        await request<unknown>({
          path: '/api/v1/notifications/unread-count',
          method: 'GET',
          credential,
          query: { source: 'all' },
          signal,
          expectedStatuses: [200],
        }),
        (v) => v.source === 'all',
      ),
    read: async (credential: string, id: string) => {
      if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id))
        throw new ApiError('configuration', 'Invalid notification resource.');
      return validate(
        readSchema,
        await request<unknown>({
          path: `/api/v1/notifications/${id}/read`,
          method: 'POST',
          credential,
          expectedStatuses: [200],
        }),
        (v) => v.notification_id === id,
      );
    },
    readAll: async (credential: string, source: InboxFilter) =>
      validate(
        readAllSchema,
        await request<unknown, { source: InboxFilter }>({
          path: '/api/v1/notifications/read-all',
          method: 'POST',
          credential,
          body: { source },
          expectedStatuses: [200],
        }),
        (v) => v.source === source,
      ),
    timezone: async (credential: string, timezone: string) =>
      validate(
        zoneSchema,
        await request<unknown, { timezone: string }>({
          path: '/api/v1/account/timezone',
          method: 'PUT',
          credential,
          body: { timezone },
          expectedStatuses: [200],
        }),
        (v) => v.timezone === timezone,
      ),
  };
}
export type InboxService = ReturnType<typeof createInboxService>;
