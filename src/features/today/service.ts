import type { EntrySource, HttpRequest } from '@/api/client';
import type { CreatePlanItem, UpdatePlanItem } from './types';
import { requireToday, requirePlanItem } from './validation';
import { requirePlanDate } from '@/features/plan/validation';
import { ApiError } from '@/api';
type Request = <R, B = never>(input: HttpRequest<B>) => Promise<R>;
const itemPath = (id: string) => {
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id))
    throw new ApiError('configuration', 'Invalid planning resource.');
  return `/api/v1/plan/items/${id}`;
};
export function createPlanningService(request: Request) {
  return {
    selectedDate: async (
      credential: string,
      selected_date: string,
      timezone: string,
      cursor?: string,
      signal?: AbortSignal,
    ) =>
      requirePlanDate(
        await request<unknown>({
          path: '/api/v1/plan',
          method: 'GET',
          query: { selected_date, timezone, limit: 50, ...(cursor ? { cursor } : {}) },
          credential,
          signal,
          expectedStatuses: [200],
        }),
        selected_date,
        timezone,
      ),
    today: async (credential: string, timezone: string, signal?: AbortSignal) =>
      requireToday(
        await request<unknown>({
          path: '/api/v1/today',
          method: 'GET',
          query: { timezone },
          credential,
          signal,
          expectedStatuses: [200],
        }),
      ),
    get: async (credential: string, id: string, signal?: AbortSignal) =>
      requirePlanItem(
        await request<unknown>({
          path: itemPath(id),
          method: 'GET',
          credential,
          signal,
          expectedStatuses: [200],
        }),
      ),
    create: async (
      credential: string,
      body: CreatePlanItem,
      key: string,
      options: { entrySource?: EntrySource; timeoutMs?: number } = {},
    ) =>
      requirePlanItem(
        await request<unknown, CreatePlanItem>({
          path: '/api/v1/plan/items',
          method: 'POST',
          credential,
          body,
          idempotencyKey: key,
          ...(options.entrySource ? { entrySource: options.entrySource } : {}),
          ...(options.timeoutMs ? { timeoutMs: options.timeoutMs } : {}),
          expectedStatuses: [201],
        }),
      ),
    update: async (credential: string, id: string, body: UpdatePlanItem) =>
      requirePlanItem(
        await request<unknown, UpdatePlanItem>({
          path: itemPath(id),
          method: 'PATCH',
          credential,
          body,
          expectedStatuses: [200],
        }),
      ),
    complete: async (credential: string, id: string, expected_version: number) =>
      requirePlanItem(
        await request<unknown, { expected_version: number }>({
          path: itemPath(id) + '/complete',
          method: 'POST',
          credential,
          body: { expected_version },
          expectedStatuses: [200],
        }),
      ),
  };
}
export type PlanningService = ReturnType<typeof createPlanningService>;
