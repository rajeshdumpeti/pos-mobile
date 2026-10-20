import { useCallback, useEffect, useRef } from 'react';
import { useFocusEffect } from 'expo-router';
import { useInfiniteQuery, useQueryClient } from '@tanstack/react-query';
import { ApiError } from '@/api';
import { planningKeys, usePlanning } from '@/features/today/PlanningProvider';
import { planningQueryPolicy } from '@/features/today/useToday';
import { useAuthenticationConnectivity } from '@/features/auth/integration/useConnectivity';
import { validCalendarDate } from './calendar';
import { mergePlanPages } from './validation';
export function usePlanDate(date: string, timezone: string | undefined) {
  const planning = usePlanning(),
    client = useQueryClient(),
    connectivity = useAuthenticationConnectivity(),
    paging = useRef(false);
  const key = planningKeys.plan(planning.account, date, timezone ?? 'unresolved');
  const query = useInfiniteQuery({
    ...planningQueryPolicy,
    queryKey: key,
    enabled: Boolean(timezone) && validCalendarDate(date) && connectivity !== 'offline',
    initialPageParam: undefined as string | undefined,
    queryFn: async ({ signal, pageParam }) => {
      const result = await planning.service.selectedDate(
        planning.credential(),
        date,
        timezone!,
        pageParam,
        signal,
      );
      if (!planning.current()) throw new ApiError('cancelled', 'Planning access changed.');
      return result;
    },
    getNextPageParam: (last) =>
      last.page.has_more ? (last.page.next_cursor ?? undefined) : undefined,
  });
  const retained = useRef<{ key: string; data: typeof query.data } | undefined>(undefined);
  const refreshing = useRef(new Set<string>());
  const refresh = useCallback(async () => {
    if (connectivity === 'offline' || !timezone || !validCalendarDate(date)) return;
    const identity = JSON.stringify(key);
    if (refreshing.current.has(identity)) return;
    refreshing.current.add(identity);
    await client.cancelQueries({ queryKey: key });
    const previous = client.getQueryData<typeof query.data>(key);
    retained.current = { key: JSON.stringify(key), data: previous };
    // Restart pagination; retain confirmed content until the first-page request settles.
    client.setQueryData<typeof query.data>(key, (old) =>
      old ? { pages: old.pages.slice(0, 1), pageParams: old.pageParams.slice(0, 1) } : old,
    );
    const result = await query.refetch();
    if (result.isError && previous && planning.current()) {
      client.getQueryCache().find({ queryKey: key })?.setState({ data: previous });
    }
    if (retained.current?.key === identity) retained.current = undefined;
    refreshing.current.delete(identity);
    return result;
  }, [client, date, timezone, planning.account, connectivity, query.refetch]);
  useFocusEffect(
    useCallback(() => {
      void refresh();
    }, [refresh]),
  );
  useEffect(() => {
    if (query.error) void planning.recover(query.error);
  }, [query.error, planning]);
  const loadMore = async () => {
    if (paging.current || query.isFetching || !query.hasNextPage || connectivity === 'offline')
      return;
    paging.current = true;
    try {
      await query.fetchNextPage();
    } finally {
      paging.current = false;
    }
  };
  const visible =
    query.isRefetching && retained.current?.key === JSON.stringify(key)
      ? (retained.current.data ?? query.data)
      : query.data;
  return {
    query,
    data: visible?.pages[0],
    items: mergePlanPages(visible?.pages ?? []),
    connectivity,
    refresh,
    loadMore,
  };
}
