import { useEffect, useRef, useState, type ReactNode } from 'react';
import { Animated, AppState, Pressable, RefreshControl, View } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { AppText, ErrorState, POSIcon, Screen, Skeleton } from '@/design-system';
import { useTheme } from '@/design-system/theme';
import { ShellHeader } from '@/features/app-shell/ShellHeader';
import { PlanningCard as Card, PlanningButton as Button } from '@/features/today/TodayVisuals';
import { usePlanAction } from '@/features/today/usePlanAction';
import { useReturnFocus } from '@/features/today/useReturnFocus';
import { useReducedMotion } from '@/features/today/motion';
import { NativePicker } from '@/features/today/NativePicker';
import { friendlyTime, friendlyCompletion, pickerDate } from '@/features/today/presentation';
import { localDate, resolveTimeZone } from '@/features/today/time';
import { mapPlanningFailure } from '@/features/today/failure';
import { FailureNotice } from '@/features/today/PlanItemPage';
import { adjacentDate, validCalendarDate } from './calendar';
import { usePlanDate } from './usePlanDate';
import type { PlanDayItem, PlanDateResource } from './validation';
function Transition({ children, duration = 230 }: { children: ReactNode; duration?: number }) {
  const { reduced } = useReducedMotion(),
    opacity = useRef(new Animated.Value(1)).current;
  useEffect(() => {
    if (reduced) return;
    opacity.setValue(0);
    const animation = Animated.timing(opacity, { toValue: 1, duration, useNativeDriver: true });
    animation.start();
    return () => animation.stop();
  }, [opacity, reduced, duration]);
  return <Animated.View style={{ opacity, gap: 16 }}>{children}</Animated.View>;
}
function Row({
  item,
  relation,
  zone,
  open,
}: {
  item: PlanDayItem;
  relation: PlanDateResource['date_relation'];
  zone: string;
  open: () => void;
}) {
  const theme = useTheme(),
    origin = useRef<View>(null),
    mark = useReturnFocus();
  const label = item.completed_at
    ? 'Currently completed'
    : relation === 'current' && item.scheduled_start_at
      ? {
          ongoing: 'Ongoing',
          upcoming: 'Upcoming',
          past: 'Past scheduled time',
          unscheduled: 'Unscheduled',
          completed: 'Currently completed',
        }[item.timing_state]
      : relation === 'past'
        ? 'Still incomplete'
        : 'Planned';
  return (
    <Pressable
      ref={origin}
      accessibilityRole="button"
      accessibilityLabel={`View ${item.title}, ${label}${item.is_priority ? ', Priority' : ''}`}
      onPress={() => {
        mark(origin);
        open();
      }}
      style={{
        minHeight: theme.accessibility.minimumTouchTarget,
        flexDirection: 'row',
        gap: theme.spacing.sm,
        paddingVertical: theme.spacing.md,
        borderBottomWidth: 1,
        borderBottomColor: theme.colors.divider,
        alignItems: 'flex-start',
      }}
    >
      <POSIcon
        name={item.completed_at ? 'check' : item.scheduled_start_at ? 'clock' : 'calendar'}
        tone="accent"
      />
      <View style={{ flex: 1, gap: theme.spacing.xxs }}>
        <AppText variant="label">{item.title}</AppText>
        <AppText variant="caption" color="secondary">
          {item.scheduled_start_at
            ? `${friendlyTime(item.scheduled_start_at, item.timezone)}${item.scheduled_end_at ? ` – ${friendlyTime(item.scheduled_end_at, item.timezone)}` : ''}`
            : 'No time scheduled'}
        </AppText>
        <AppText
          variant="caption"
          color={item.timing_state === 'ongoing' && relation === 'current' ? 'accent' : 'muted'}
        >
          {label}
          {item.is_priority ? ' · Priority' : ''}
        </AppText>
        {item.timezone !== zone && item.scheduled_start_at && (
          <AppText variant="caption" color="secondary">
            Times in {item.timezone}
          </AppText>
        )}
        {item.completed_at && (
          <AppText variant="caption" color="muted">
            Confirmed {friendlyCompletion(item.completed_at, item.timezone)}
          </AppText>
        )}
      </View>
      <POSIcon name="chevron" tone="muted" />
    </Pressable>
  );
}
export function PlanScreen() {
  const theme = useTheme(),
    params = useLocalSearchParams<{ selectedDate?: string }>(),
    [timezone, setTimezone] = useState(resolveTimeZone);
  const [date, setDate] = useState(() =>
      validCalendarDate(params.selectedDate)
        ? params.selectedDate
        : timezone
          ? localDate(new Date(), timezone)
          : '',
    ),
    [picker, setPicker] = useState(false),
    [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const { query, data, items, connectivity, refresh, loadMore } = usePlanDate(date, timezone);
  const open = usePlanAction({ origin: 'plan', selectedDate: date }),
    dateButton = useRef<View>(null),
    addButton = useRef<View>(null),
    mark = useReturnFocus(dateButton);
  useEffect(() => {
    if (validCalendarDate(params.selectedDate)) setDate(params.selectedDate);
  }, [params.selectedDate]);
  useEffect(() => {
    const subscription = AppState.addEventListener('change', (state) => {
      if (state === 'active') setTimezone(resolveTimeZone());
    });
    return () => subscription.remove();
  }, []);
  const failure = query.error ? mapPlanningFailure(query.error) : undefined;
  const completed = items.filter((i) => i.section === 'completed'),
    isExpanded =
      expanded[date] ?? Boolean(data && data.summary.total > 0 && data.summary.remaining === 0);
  const heading = (label: string) => (
    <AppText variant="title" accessibilityRole="header">
      {label}
    </AppText>
  );
  const section = (label: string, bucket: PlanDayItem['section']) => {
    const values = items.filter((i) => i.section === bucket);
    return (
      <Card tier="support">
        {heading(label)}
        {values.length ? (
          values.map((item) => (
            <Row
              key={item.id}
              item={item}
              relation={data!.date_relation}
              zone={timezone!}
              open={() => open('plan_item.view', item.id)}
            />
          ))
        ) : (
          <AppText color="secondary">
            {query.hasNextPage
              ? 'No items from this section loaded yet.'
              : 'No items in this section.'}
          </AppText>
        )}
      </Card>
    );
  };
  return (
    <Screen
      testID="plan-screen"
      contentContainerStyle={{
        paddingHorizontal: theme.spacing.lg,
        gap: theme.spacing.lg,
        paddingBottom: theme.spacing.huge,
      }}
      refreshControl={
        <RefreshControl
          refreshing={query.isFetching && !query.isPending && !query.isFetchingNextPage}
          onRefresh={() => void refresh()}
          tintColor={theme.colors.accentPrimary}
        />
      }
    >
      <ShellHeader title="Plan" />
      <View style={{ gap: theme.spacing.sm }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: theme.spacing.xs }}>
          <Button
            label=""
            accessibilityLabel="Previous calendar day"
            leadingIcon="back"
            variant="ghost"
            disabled={!date || date === '0001-01-01'}
            onPress={() => setDate(adjacentDate(date, -1))}
          />
          <Button
            ref={dateButton}
            label={
              date
                ? new Intl.DateTimeFormat(undefined, {
                    weekday: 'short',
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric',
                    timeZone: 'UTC',
                  }).format(new Date(`${date}T12:00:00Z`))
                : 'Choose date'
            }
            accessibilityLabel={`Choose Plan date, ${date}`}
            variant="secondary"
            style={{ flex: 1 }}
            onPress={() => {
              mark(dateButton);
              setPicker(true);
            }}
            disabled={!timezone}
          />
          <Button
            label=""
            leadingIcon="chevron"
            accessibilityLabel="Next calendar day"
            variant="ghost"
            disabled={!date || date === '9999-12-31'}
            onPress={() => setDate(adjacentDate(date, 1))}
          />
        </View>
        <Button
          label="Today"
          variant="ghost"
          onPress={() => {
            const zone = resolveTimeZone();
            setTimezone(zone);
            if (zone) setDate(localDate(new Date(), zone));
          }}
        />
      </View>
      {!timezone && (
        <ErrorState
          title="Timezone unavailable"
          message="Check your device timezone to load Plan."
          onRetry={() => {
            const zone = resolveTimeZone();
            setTimezone(zone);
            if (zone && !date) setDate(localDate(new Date(), zone));
          }}
        />
      )}
      {timezone && !data && query.isPending && connectivity !== 'offline' && (
        <>
          <Skeleton height={140} accessibilityLabel="Loading Plan Insight" />
          <Skeleton height={80} accessibilityLabel="Loading daily summary" />
          <Skeleton height={180} accessibilityLabel="Loading selected-date items" />
        </>
      )}
      {!data && (failure || connectivity === 'offline') && (
        <>
          <ErrorState
            title={connectivity === 'offline' ? 'You’re offline' : 'Plan is unavailable'}
            message={
              connectivity === 'offline' ? 'Connect and retry to load this date.' : failure!.message
            }
            onRetry={() => void refresh()}
          />
          <FailureNotice failure={failure} />
        </>
      )}
      {data && (
        <Transition key={date}>
          {(failure || connectivity === 'offline' || query.isFetching) && (
            <Card>
              <AppText accessibilityRole="alert">
                {connectivity === 'offline'
                  ? 'Offline · showing confirmed information for this date'
                  : failure
                    ? 'Refresh failed · showing confirmed information for this date'
                    : 'Refreshing this date…'}
              </AppText>
              <FailureNotice failure={failure} />
              {!query.isFetching && (
                <Button
                  label={
                    query.isFetchNextPageError && failure?.kind === 'validation'
                      ? 'Reload date from first page'
                      : 'Retry refresh'
                  }
                  variant="secondary"
                  onPress={() => void refresh()}
                />
              )}
            </Card>
          )}
          <Card tier="intelligence">
            {heading('Plan Insight')}
            <View style={{ flexDirection: 'row', gap: theme.spacing.sm }}>
              <POSIcon name="calendar" tone="accent" />
              <View style={{ flex: 1, gap: theme.spacing.sm }}>
                <AppText variant="title">{data.insight.recommendation}</AppText>
                <AppText color="secondary">{data.insight.reason}</AppText>
              </View>
            </View>
            {data.insight.state !== 'unavailable' &&
              data.insight.state !== 'error' &&
              data.insight.action && (
                <Button
                  label={
                    data.insight.action === 'plan_item.create'
                      ? 'Add an item to this day'
                      : 'View recommended item'
                  }
                  onPress={() => {
                    mark(addButton);
                    open(data.insight.action!, data.insight.plan_item_id);
                  }}
                />
              )}
          </Card>
          <Card>
            {heading('Daily Summary')}
            <AppText variant="caption" color="muted">
              {data.date_relation === 'past'
                ? 'Items currently assigned to this date'
                : 'All items assigned to this date'}
            </AppText>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: theme.spacing.lg }}>
              <AppText>{data.summary.completed} currently completed</AppText>
              <AppText>{data.summary.remaining} remaining</AppText>
              <AppText variant="title">
                {data.summary.completion_percentage === null
                  ? 'No items yet'
                  : `${data.summary.completion_percentage}%`}
              </AppText>
            </View>
          </Card>
          {data.summary.total === 0 && (
            <Card>
              <AppText variant="title">No items assigned to this date</AppText>
              <AppText color="secondary">Add a plan item when you’re ready.</AppText>
            </Card>
          )}
          {section('Scheduled', 'scheduled_incomplete')}
          {section('Unscheduled', 'unscheduled_incomplete')}
          <Card tier="support">
            {heading('Completed')}
            <AppText variant="caption" color="secondary">
              {completed.length} loaded · {data.summary.completed} currently completed across this
              date
            </AppText>
            <Transition key={`completed:${isExpanded}`} duration={230}>
              {(isExpanded ? completed : completed.slice(0, 3)).map((item) => (
                <Transition key={`${item.id}:${item.version}`} duration={300}>
                  <Row
                    item={item}
                    relation={data.date_relation}
                    zone={timezone!}
                    open={() => open('plan_item.view', item.id)}
                  />
                </Transition>
              ))}
            </Transition>
            {completed.length > 3 && (
              <Button
                label={
                  isExpanded
                    ? 'Show fewer completed items'
                    : `Show all ${completed.length} loaded completed items`
                }
                variant="ghost"
                accessibilityState={{ expanded: isExpanded }}
                onPress={() => setExpanded((old) => ({ ...old, [date]: !isExpanded }))}
              />
            )}
          </Card>
          {query.hasNextPage && (
            <Button
              label={query.isFetchingNextPage ? 'Loading more items…' : 'Load more items'}
              loading={query.isFetchingNextPage}
              disabled={
                query.isFetching ||
                connectivity === 'offline' ||
                Boolean(query.isFetchNextPageError && failure?.kind === 'validation')
              }
              onPress={() => void loadMore()}
            />
          )}
          <AppText variant="caption" color="muted">
            {items.length} loaded of {data.summary.total} assigned items. Changes between pages can
            change this list.
          </AppText>
          <Button
            ref={addButton}
            label="Add plan item"
            leadingIcon="add"
            onPress={() => {
              mark(addButton);
              open('plan_item.create');
            }}
          />
        </Transition>
      )}
      {picker && timezone && (
        <NativePicker
          mode="date"
          value={pickerDate(date, timezone)}
          zone={timezone}
          label="Choose Plan date"
          onConfirm={(value) => setDate(localDate(value, timezone))}
          onConfirmWall={(wall) => setDate(wall.date)}
          onClose={() => setPicker(false)}
        />
      )}
    </Screen>
  );
}
