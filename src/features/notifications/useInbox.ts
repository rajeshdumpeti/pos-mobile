import { useCallback, useEffect, useRef, useState } from 'react';
import { useFocusEffect } from 'expo-router';
import { useInfiniteQuery, useQueryClient, type InfiniteData } from '@tanstack/react-query';
import { ApiError } from '@/api';
import { useAuthenticationConnectivity } from '@/features/auth/integration/useConnectivity';
import { inboxQueryPolicy, useInboxContext } from './InboxProvider';
import type { InboxFilter, InboxItem, InboxPage } from './contracts';
import { inboxKeys, nextCursor, uniqueItems } from './state';
export function useInbox(source: InboxFilter) {
  const context = useInboxContext(),
    client = useQueryClient(),
    connectivity = useAuthenticationConnectivity();
  const key = inboxKeys.list(context.account, source, context.zone ?? 'unresolved');
  const [refreshBusy, setRefreshBusy] = useState(false);
  const [busy, setBusy] = useState(false),
    [failure, setFailure] = useState<unknown>();
  const paging = useRef(false),
    refreshing = useRef(false),
    alive = useRef(true);
  useEffect(() => {
    alive.current = true;
    return () => {
      alive.current = false;
    };
  }, []);
  const query = useInfiniteQuery({
    ...inboxQueryPolicy,
    queryKey: key,
    initialPageParam: undefined as string | undefined,
    enabled: Boolean(context.zone) && connectivity !== 'offline',
    queryFn: async ({ pageParam, signal }) => {
      const data = await context.service.list(
        context.credential(),
        source,
        context.zone!,
        pageParam,
        signal,
      );
      if (!context.current() || signal.aborted)
        throw new ApiError('cancelled', 'Inbox access changed.');
      return data;
    },
    getNextPageParam: (last, _pages, _lastParam, params) =>
      refreshing.current ? undefined : nextCursor(last, params),
  });
  const refresh = async () => {
    if (refreshing.current || context.lock.current || connectivity === 'offline') return;
    refreshing.current = true;
    setRefreshBusy(true);
    try {
      await client.cancelQueries({ queryKey: key, exact: true });
      // During explicit refresh the infinite-query continuation stops after page one.
      // React Query keeps all confirmed pages visible until that request succeeds.
      await query.refetch();
      await client.invalidateQueries({ queryKey: inboxKeys.count(context.account) });
    } finally {
      refreshing.current = false;
      if (alive.current) setRefreshBusy(false);
    }
  };
  useFocusEffect(
    useCallback(() => {
      void client.invalidateQueries({ queryKey: inboxKeys.count(context.account) });
    }, [client, context.account]),
  );
  useEffect(() => {
    if (query.error) void context.recover(query.error);
  }, [query.error, context]);
  const items = uniqueItems(query.data?.pages ?? []);
  const operation = async (item?: InboxItem) => {
    if (context.lock.current || connectivity === 'offline' || !context.current()) return false;
    context.lock.current = true;
    setBusy(true);
    setFailure(undefined);
    try {
      await client.cancelQueries({ queryKey: inboxKeys.account(context.account) });
      if (!context.current()) return false;
      if (item && !item.is_read) {
        const result = await context.service.read(context.credential(), item.notification_id);
        if (!context.current()) return false;
        client.setQueriesData<InfiniteData<InboxPage>>(
          { queryKey: [...inboxKeys.account(context.account), 'list'] },
          (old) =>
            old && {
              ...old,
              pages: old.pages.map((page) => ({
                ...page,
                items: page.items.map((row) =>
                  row.notification_id === result.notification_id
                    ? { ...row, is_read: result.is_read, read_at: result.read_at }
                    : row,
                ),
                ...(page.filter === 'all' ? { unread_count: result.unread_count } : {}),
              })),
            },
        );
        client.setQueryData(inboxKeys.count(context.account), {
          unread_count: result.unread_count,
        });
      } else if (!item) {
        const result = await context.service.readAll(context.credential(), source);
        if (!context.current()) return false;
        client.setQueriesData<InfiniteData<InboxPage>>(
          { queryKey: [...inboxKeys.account(context.account), 'list'] },
          (old) =>
            old && {
              ...old,
              pages: old.pages.map((page) => ({
                ...page,
                items: page.items.map((row) =>
                  (source === 'all' || row.source === source) && !row.is_read
                    ? { ...row, is_read: true, read_at: result.read_at }
                    : row,
                ),
                ...(page.filter === source ? { unread_count: result.unread_count } : {}),
              })),
            },
        );
        if (source === 'all')
          client.setQueryData(inboxKeys.count(context.account), {
            unread_count: result.unread_count,
          });
      }
      // Reconcile complete filtered counts; mutation responses have different count scopes.
      await client.invalidateQueries({ queryKey: inboxKeys.account(context.account) });
      return context.current();
    } catch (error) {
      if (context.current() && alive.current) {
        setFailure(error);
        void context.recover(error);
      }
      return false;
    } finally {
      context.lock.current = false;
      if (alive.current) setBusy(false);
    }
  };
  return {
    query,
    items,
    context,
    connectivity,
    busy,
    failure,
    refresh,
    refreshBusy,
    operation,
    loadMore: async () => {
      if (
        paging.current ||
        context.lock.current ||
        !query.hasNextPage ||
        query.isFetching ||
        connectivity === 'offline'
      )
        return;
      paging.current = true;
      try {
        await query.fetchNextPage({ cancelRefetch: false });
      } finally {
        paging.current = false;
      }
    },
    unreadCount: query.data?.pages[0]?.unread_count,
    cursorLoop: Boolean(
      query.data?.pages.length && query.data.pages.at(-1)?.has_more && !query.hasNextPage,
    ),
  };
}
