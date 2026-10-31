import { useEffect, useRef, useState } from 'react';
import { Pressable, RefreshControl, View } from 'react-native';
import { useRouter } from 'expo-router';
import { ApiError } from '@/api';
import { AppText, Button, Card, IconButton, POSIcon, Screen, Skeleton } from '@/design-system';
import { useTheme } from '@/design-system/theme';
import { ShellModalPanel } from '@/features/app-shell/ShellModalPanel';
import { routes, useSafeNavigation } from '@/navigation';
import { usePlanning } from '@/features/today/PlanningProvider';
import { useReturnFocus } from '@/features/today/useReturnFocus';
import { destination, inboxFailure } from './state';
import { useInbox } from './useInbox';
import type { InboxFilter, InboxItem } from './contracts';
export function InboxScreen() {
  const navigation = useSafeNavigation();
  return (
    <ShellModalPanel
      title="Notifications"
      onDismiss={() => navigation.dismissOrReplace(routes.app.index)}
    >
      {(close) => <InboxContent close={close} />}
    </ShellModalPanel>
  );
}
export function InboxContent({ close }: { close: () => void }) {
  const [source, setSource] = useState<InboxFilter>('all'),
    [notice, setNotice] = useState<string>();
  const inbox = useInbox(source),
    theme = useTheme(),
    router = useRouter(),
    planning = usePlanning();
  const opening = useRef(false),
    mounted = useRef(true);
  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);
  const current = () => mounted.current && inbox.context.current();
  const markOrigin = useReturnFocus();
  const open = async (item: InboxItem, origin: Parameters<typeof markOrigin>[0]) => {
    if (opening.current || inbox.busy) return;
    opening.current = true;
    setNotice(undefined);
    try {
      if (!(await inbox.operation(item)) || !current()) return;
      const target = destination(item, inbox.context.zone!);
      if (target.kind === 'unavailable') setNotice('This item is no longer available.');
      else if (target.kind === 'today' || target.kind === 'historicalToday') {
        try {
          const currentToday = await planning.service.today(
            planning.credential(),
            inbox.context.zone!,
          );
          if (!current()) return;
          if (item.navigation.selected_date !== currentToday.local_date) {
            setNotice('Historical Today views are not available for this notification.');
          } else {
            markOrigin(origin);
            router.navigate(routes.app.index);
          }
        } catch (error) {
          if (!current()) return;
          setNotice('We couldn’t open Today. Try again.');
          void planning.recover(error);
        }
      } else {
        try {
          // Revalidate ownership/existence immediately; the existing detail screen revalidates again.
          const latest = await planning.service.get(planning.credential(), target.id);
          if (!current()) return;
          markOrigin(origin);
          router.push({
            pathname: routes.app.planItem,
            params: { id: target.id, selectedDate: latest.scheduled_for_date },
          });
        } catch (error) {
          if (!current()) return;
          setNotice(
            error instanceof ApiError && error.metadata.status === 404
              ? 'This item is no longer available.'
              : 'We couldn’t open this item. Try again.',
          );
          void planning.recover(error);
        }
      }
    } finally {
      opening.current = false;
    }
  };
  const error = inbox.failure ?? inbox.query.error;
  const invalidCursor =
    inbox.query.isFetchNextPageError && error instanceof ApiError && error.metadata.status === 422;
  return (
    <Screen
      contentContainerStyle={{ paddingHorizontal: theme.spacing.md }}
      refreshControl={
        <RefreshControl
          refreshing={
            inbox.refreshBusy || (inbox.query.isRefetching && !inbox.query.isFetchingNextPage)
          }
          onRefresh={() => void inbox.refresh()}
        />
      }
    >
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: theme.spacing.xs }}>
        <IconButton icon="back" accessibilityLabel="Back from Notifications" onPress={close} />
        <AppText variant="title" accessibilityRole="header" style={{ flex: 1 }}>
          Notifications
        </AppText>
      </View>
      <View
        accessibilityRole="tablist"
        style={{
          flexDirection: 'row',
          backgroundColor: theme.colors.accentSoft,
          borderRadius: theme.radii.medium,
          padding: theme.spacing.xxs,
        }}
      >
        {(['all', 'today', 'plan'] as const).map((filter) => (
          <Pressable
            key={filter}
            accessibilityRole="tab"
            accessibilityLabel={`${filter === 'all' ? 'All' : filter === 'today' ? 'Today' : 'Plan'} notifications`}
            accessibilityState={{ selected: source === filter, disabled: inbox.busy }}
            disabled={inbox.busy}
            onPress={() => {
              setSource(filter);
              setNotice(undefined);
            }}
            style={{
              flex: 1,
              minHeight: theme.accessibility.minimumTouchTarget,
              alignItems: 'center',
              justifyContent: 'center',
              padding: theme.spacing.xs,
              borderRadius: theme.radii.medium,
              backgroundColor: source === filter ? theme.colors.accentPrimary : 'transparent',
            }}
          >
            <AppText
              style={{
                color: source === filter ? theme.colors.onAccent : theme.colors.textPrimary,
              }}
            >
              {filter === 'all' ? 'All' : filter === 'today' ? 'Today' : 'Plan'}
            </AppText>
          </Pressable>
        ))}
      </View>
      {inbox.unreadCount !== undefined && (
        <View accessibilityLiveRegion="polite">
          <AppText color="secondary">
            {inbox.unreadCount} unread
            {inbox.query.isError || inbox.connectivity === 'offline' ? ' · may be out of date' : ''}
          </AppText>
        </View>
      )}
      <Button
        label="Mark all as read"
        accessibilityLabel={`Mark all ${source} notifications as read`}
        variant="ghost"
        loading={inbox.busy}
        disabled={
          inbox.busy ||
          inbox.connectivity === 'offline' ||
          inbox.unreadCount === undefined ||
          inbox.unreadCount === 0
        }
        onPress={() => void inbox.operation()}
      />
      {inbox.context.timezoneFailed && (
        <>
          <AppText color="secondary">
            Your notification timezone hasn’t been synchronized. Available history is still shown.
          </AppText>
          <Button
            label="Retry timezone synchronization"
            variant="ghost"
            onPress={inbox.context.sync}
          />
        </>
      )}
      {!inbox.context.zone && (
        <AppText accessibilityRole="alert">
          A device timezone is required to load notifications.
        </AppText>
      )}
      {inbox.connectivity === 'offline' && (
        <AppText accessibilityRole="alert">
          You’re offline. Confirmed notifications may be out of date. Retry when connected.
        </AppText>
      )}
      {inbox.query.isPending && inbox.query.isFetching && (
        <View accessibilityLabel="Loading notifications">
          {[0, 1, 2].map((i) => (
            <Skeleton key={i} height={90} />
          ))}
        </View>
      )}
      {error != null && (
        <View accessibilityLiveRegion="polite">
          <AppText accessibilityRole="alert">{inboxFailure(error)}</AppText>
          {error instanceof ApiError && error.metadata.requestId && (
            <AppText variant="caption">Support ID: {error.metadata.requestId}</AppText>
          )}
        </View>
      )}
      {notice && <AppText accessibilityLiveRegion="polite">{notice}</AppText>}
      {(inbox.query.isError || inbox.cursorLoop) && (
        <Button
          label={
            invalidCursor || inbox.cursorLoop
              ? 'Restart notifications'
              : inbox.query.isFetchNextPageError
                ? 'Retry loading more'
                : 'Try again'
          }
          variant="secondary"
          disabled={inbox.busy || inbox.query.isFetching || inbox.connectivity === 'offline'}
          onPress={() =>
            void (inbox.query.isFetchNextPageError && !invalidCursor && !inbox.cursorLoop
              ? inbox.loadMore()
              : inbox.refresh())
          }
        />
      )}
      {inbox.query.isSuccess && inbox.items.length === 0 && (
        <Card>
          <POSIcon name="notifications" tone="muted" size={36} />
          <AppText variant="title">You’re all caught up</AppText>
          <AppText color="secondary">
            {source === 'all'
              ? 'Notifications from Today and Plan will appear here.'
              : `Notifications from ${source === 'today' ? 'Today' : 'Plan'} will appear here.`}
          </AppText>
        </Card>
      )}
      {(['today', 'earlier'] as const).map((group) => {
        const rows = inbox.items.filter((item) => item.group === group);
        return (
          rows.length > 0 && (
            <View key={group} style={{ gap: theme.spacing.sm }}>
              <AppText variant="label" accessibilityRole="header">
                {group === 'today' ? 'Today' : 'Earlier'}
              </AppText>
              {rows.map((item) => (
                <InboxRow
                  key={item.notification_id}
                  item={item}
                  zone={inbox.context.zone!}
                  busy={inbox.busy || inbox.connectivity === 'offline'}
                  onOpen={open}
                />
              ))}
            </View>
          )
        );
      })}
      {inbox.query.hasNextPage && !inbox.query.isFetchNextPageError && (
        <Button
          label="Load more notifications"
          variant="secondary"
          loading={inbox.query.isFetchingNextPage}
          disabled={inbox.busy || inbox.query.isFetching || inbox.connectivity === 'offline'}
          onPress={() => void inbox.loadMore()}
        />
      )}
    </Screen>
  );
}
function InboxRow({
  item,
  zone,
  busy,
  onOpen,
}: {
  item: InboxItem;
  zone: string;
  busy: boolean;
  onOpen: (
    item: InboxItem,
    origin: Parameters<ReturnType<typeof useReturnFocus>>[0],
  ) => Promise<void>;
}) {
  const theme = useTheme(),
    origin = useRef<View>(null);
  const target = destination(item, zone);
  const timestamp = new Intl.DateTimeFormat(undefined, {
    timeZone: zone,
    ...(item.group === 'earlier'
      ? ({ month: 'short', day: 'numeric', year: 'numeric' } as const)
      : {}),
    hour: 'numeric',
    minute: '2-digit',
  }).format(new Date(item.created_at));
  return (
    <Pressable
      ref={origin}
      accessibilityRole="button"
      accessibilityLabel={`${item.is_read ? 'Read' : 'Unread'}. ${item.source === 'today' ? 'Today' : 'Plan'}. ${item.title}. ${item.message}. ${timestamp}`}
      accessibilityHint={
        target.kind === 'plan' || target.kind === 'today'
          ? 'Marks as read and opens the source.'
          : 'Marks as read and explains source availability.'
      }
      accessibilityState={{ disabled: busy }}
      disabled={busy}
      onPress={() => void onOpen(item, origin)}
      style={{
        minHeight: theme.accessibility.minimumTouchTarget,
        flexDirection: 'row',
        alignItems: 'flex-start',
        gap: theme.spacing.sm,
        padding: theme.spacing.md,
        borderWidth: 1,
        borderColor: theme.colors.borderDefault,
        borderRadius: theme.radii.large,
        backgroundColor: theme.colors.surfacePrimary,
      }}
    >
      <View
        style={{
          padding: theme.spacing.xs,
          borderRadius: theme.radii.medium,
          backgroundColor: theme.colors.accentSoft,
        }}
      >
        <POSIcon
          name={
            item.source === 'plan' ? 'calendar' : item.category === 'attention' ? 'alert' : 'today'
          }
          tone="accent"
          size={24}
        />
      </View>
      <View style={{ flex: 1, gap: theme.spacing.xxs }}>
        <AppText variant="label">{item.title}</AppText>
        <AppText color="secondary">{item.message}</AppText>
        <AppText variant="caption" color="muted">
          {item.source === 'today' ? 'Today' : 'Plan'} · {timestamp}
        </AppText>
        <AppText variant="caption" color={item.is_read ? 'muted' : 'accent'}>
          {item.is_read ? 'Read' : 'Unread'}
        </AppText>
      </View>
      {(target.kind === 'plan' || target.kind === 'today') && (
        <POSIcon name="chevron" tone="muted" />
      )}
    </Pressable>
  );
}
