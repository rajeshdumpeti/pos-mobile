import { useRef, useState } from 'react';
import {
  AccessibilityInfo,
  Pressable,
  RefreshControl,
  View,
  findNodeHandle,
  useWindowDimensions,
} from 'react-native';
import { AppText, ErrorState, Screen, Skeleton, POSIcon } from '@/design-system';
import { useTheme } from '@/design-system/theme';
import { planningTypography, planningVisuals } from '@/design-system/tokens';
import { ShellHeader } from '@/features/app-shell/ShellHeader';
import { useToday } from './useToday';
import { mapPlanningFailure } from './failure';
import { recommendationCopy, sectionCopy, visibleActions } from './actions';
import { usePlanAction } from './usePlanAction';
import { ScoreBreakdown, ScoreRing } from './ScoreBreakdown';
import { formatInstant } from './time';
import { friendlyDate, friendlyTime } from './presentation';
import {
  PlanningCard as Card,
  PlanningButton as Button,
  ContextIllustration,
  illustrationFor,
} from './TodayVisuals';
import { Settle } from './motion';
import { useReturnFocus } from './useReturnFocus';
import type { PlanSummary, SectionState, TodayResource } from './types';
const statusCopy: Record<TodayResource['daily_status']['code'], string> = {
  getting_started: 'Your daily plan starts here',
  complete: 'Your plan is complete',
  needs_attention: 'Scheduled items need attention',
  on_track: 'Your plan is moving forward',
};
function SectionMessage({ state, empty }: { state: SectionState; empty: string }) {
  return state === 'available' ? null : (
    <AppText color="secondary" accessibilityLiveRegion="polite">
      {state === 'empty' ? empty : sectionCopy[state]}
    </AppText>
  );
}
function ItemRow({
  item,
  label,
  onView,
  disabled = false,
  priority = false,
  referenceDate,
  markOrigin,
}: {
  item: PlanSummary;
  label?: string;
  onView: () => void;
  disabled?: boolean;
  priority?: boolean;
  referenceDate?: string;
  markOrigin: ReturnType<typeof useReturnFocus>;
}) {
  const theme = useTheme(),
    origin = useRef<View>(null),
    [pressed, setPressed] = useState(false);
  return (
    <Pressable
      ref={origin}
      accessibilityRole="button"
      accessibilityLabel={`View ${item.title}${label ? `, ${label}` : ''}`}
      disabled={disabled}
      accessibilityState={{ disabled }}
      onPress={() => {
        markOrigin(origin);
        onView();
      }}
      onPressIn={() => setPressed(true)}
      onPressOut={() => setPressed(false)}
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: theme.spacing.sm,
        paddingVertical: theme.spacing.sm,
        minHeight: theme.accessibility.minimumTouchTarget,
        opacity: pressed ? theme.opacity.pressed : 1,
      }}
    >
      <View
        style={{
          padding: theme.spacing.xs,
          borderRadius: theme.radii.small,
          backgroundColor: item.completed_at ? theme.colors.successSoft : theme.colors.accentSoft,
        }}
      >
        <POSIcon
          name={item.completed_at ? 'check' : priority ? 'priority' : 'calendar'}
          color={item.completed_at ? theme.colors.success : theme.colors.accentPrimary}
        />
      </View>
      <View style={{ flex: 1, gap: theme.spacing.xxs }}>
        {label && (
          <AppText variant="caption" color="accent">
            {label}
          </AppText>
        )}
        <AppText variant="label">{item.title}</AppText>
        <AppText variant="caption" color="secondary">
          {item.completed_at
            ? `Completed at ${friendlyTime(item.completed_at, item.timezone)}`
            : item.scheduled_start_at
              ? friendlyTime(item.scheduled_start_at, item.timezone)
              : `Assigned ${friendlyDate(item.scheduled_for_date, item.timezone, referenceDate)}`}
        </AppText>
        {item.scheduled_end_at && (
          <AppText variant="caption" color="muted">
            Ends {friendlyTime(item.scheduled_end_at, item.timezone)}
          </AppText>
        )}
      </View>
    </Pressable>
  );
}
export function TodayScreen() {
  const theme = useTheme(),
    { width, fontScale } = useWindowDimensions(),
    open = usePlanAction();
  const { query, confirmedData, timezone, connectivity, refresh } = useToday();
  const [breakdown, setBreakdown] = useState(false),
    scoreButton = useRef<View>(null),
    heroButton = useRef<View>(null),
    addButton = useRef<View>(null),
    markOrigin = useReturnFocus(scoreButton);
  const data = query.data ?? confirmedData,
    failed = query.error ? mapPlanningFailure(query.error) : undefined;
  const stale = Boolean(
    data && (failed || connectivity === 'offline' || data.timezone !== timezone),
  );
  const actions = visibleActions(data?.capabilities.actions ?? []);
  const permitted = (action: TodayResource['next_best_action']['action']) =>
    actions.includes(action);
  const hero = data ? recommendationCopy[data.next_best_action.code] : undefined;
  const twoColumns = width >= 420 && fontScale <= 1.2;
  return (
    <Screen
      testID="today-screen"
      contentContainerStyle={{
        paddingHorizontal: width < 360 ? theme.spacing.md : theme.spacing.lg,
        gap: theme.spacing.xl,
      }}
      refreshControl={
        <RefreshControl
          refreshing={query.isFetching && !query.isPending}
          onRefresh={() => void refresh()}
          tintColor={theme.colors.accentPrimary}
        />
      }
    >
      <ShellHeader title="Today" />
      {!timezone && (
        <ErrorState
          title="Timezone unavailable"
          message="POS needs a valid device timezone to load Today."
          onRetry={() => void refresh()}
        />
      )}
      {timezone && !data && connectivity === 'offline' && (
        <ErrorState
          title="You’re offline"
          message="Today hasn’t loaded yet. Connect and try again."
          onRetry={() => void refresh()}
        />
      )}
      {timezone && !data && connectivity !== 'offline' && query.isPending && (
        <View style={{ gap: theme.spacing.md }}>
          <Skeleton
            height={theme.spacing.huge * 3}
            accessibilityLabel="Loading Today’s recommendation"
          />
          <Skeleton height={theme.spacing.huge * 2} accessibilityLabel="Loading Today’s score" />
          <Skeleton height={theme.spacing.huge * 3} accessibilityLabel="Loading Today’s plan" />
        </View>
      )}
      {!data && failed && connectivity !== 'offline' && (
        <ErrorState
          title="Today is unavailable"
          message={failed.message}
          onRetry={() => void refresh()}
        />
      )}
      {!data && failed?.requestId && (
        <AppText variant="caption" color="muted">
          Support ID: {failed.requestId}
        </AppText>
      )}
      {data && (
        <>
          {(stale || query.isFetching) && (
            <Card
              style={{
                gap: theme.spacing.xs,
                backgroundColor: stale ? theme.colors.warningSoft : theme.colors.surfaceElevated,
              }}
            >
              <AppText
                accessibilityRole={stale ? 'alert' : undefined}
                accessibilityLiveRegion="polite"
              >
                {connectivity === 'offline'
                  ? 'Offline · showing previously confirmed information'
                  : stale
                    ? failed
                      ? 'Refresh failed · showing previously confirmed information'
                      : 'Timezone changed · showing previously confirmed information'
                    : 'Refreshing Today…'}
              </AppText>
              {stale && (
                <>
                  <AppText color="secondary">
                    Last confirmed {formatInstant(data.generated_at, data.timezone)}
                  </AppText>
                  <Button label="Retry Today" variant="secondary" onPress={() => void refresh()} />
                </>
              )}
              {failed?.requestId && (
                <AppText variant="caption" color="muted">
                  Support ID: {failed.requestId}
                </AppText>
              )}
            </Card>
          )}
          <Settle>
            <View style={{ gap: theme.spacing.xs }}>
              <AppText variant="caption" color="muted" accessibilityRole="header">
                DAILY STATUS
              </AppText>
              <SectionMessage state={data.daily_status.state} empty="No daily status yet." />
              {data.daily_status.state === 'available' && (
                <>
                  <AppText variant="title" style={{ fontWeight: theme.fontWeights.semibold }}>
                    {statusCopy[data.daily_status.code]}
                  </AppText>
                  <AppText color="secondary">
                    {data.daily_status.completed} completed · {data.daily_status.remaining}{' '}
                    remaining
                    {data.daily_status.overdue > 0
                      ? ` · ${data.daily_status.overdue} past scheduled start`
                      : ''}
                  </AppText>
                </>
              )}
            </View>
          </Settle>
          <Settle delay={40}>
            <Card tier="intelligence">
              <View
                style={{
                  flexDirection: fontScale > 1.4 ? 'column' : 'row',
                  alignItems: 'flex-start',
                  gap: theme.spacing.md,
                }}
              >
                <View style={{ flex: 1, gap: theme.spacing.xs }}>
                  <AppText variant="caption" color="secondary" accessibilityRole="header">
                    NEXT BEST ACTION
                  </AppText>
                  <AppText
                    variant="title"
                    style={
                      fontScale > 1.4
                        ? planningTypography.accessibleHeadline
                        : planningTypography.headline
                    }
                  >
                    {hero?.title}
                  </AppText>
                  <AppText color="secondary">{hero?.reason}</AppText>
                </View>
                <ContextIllustration
                  kind={illustrationFor(data.next_best_action.code)}
                  size={
                    width < 360 ? planningVisuals.compactIllustration : planningVisuals.illustration
                  }
                />
              </View>
              <AppText variant="caption" color="muted" style={planningTypography.support}>
                Based on {data.next_best_action.evidence.eligible} eligible items;{' '}
                {data.next_best_action.evidence.remaining} remaining.
              </AppText>
              {permitted(data.next_best_action.action) && (
                <Button
                  ref={heroButton}
                  label={
                    data.next_best_action.action === 'plan_item.create'
                      ? 'Create a plan item'
                      : 'View plan item'
                  }
                  onPress={() => {
                    markOrigin(heroButton);
                    open(data.next_best_action.action, data.next_best_action.plan_item_id);
                  }}
                />
              )}
            </Card>
          </Settle>
          <Settle delay={80}>
            <Pressable
              ref={scoreButton}
              accessibilityRole="button"
              accessibilityLabel={`View score breakdown, ${data.score.percentage === null ? 'no score yet' : `${data.score.percentage} percent`}`}
              onPress={() => setBreakdown(true)}
            >
              <Card style={{ gap: theme.spacing.sm }}>
                <AppText variant="caption" accessibilityRole="header">
                  TODAY’S SCORE
                </AppText>
                <View
                  style={{
                    flexDirection: width < 360 || fontScale > 1.2 ? 'column' : 'row',
                    alignItems: width < 360 || fontScale > 1.2 ? 'flex-start' : 'center',
                    gap: theme.spacing.md,
                  }}
                >
                  <View
                    style={{ flex: 1, minWidth: theme.spacing.huge * 2, gap: theme.spacing.xs }}
                  >
                    <AppText
                      variant={data.score.percentage === null ? 'title' : 'display'}
                      style={
                        data.score.percentage === null
                          ? undefined
                          : fontScale > 1.4
                            ? planningTypography.accessibleMetric
                            : planningTypography.metric
                      }
                    >
                      {data.score.percentage === null
                        ? 'No score yet'
                        : `${data.score.percentage}%`}
                    </AppText>
                    <AppText color="secondary">
                      {data.score.numerator} of {data.score.denominator} plan items completed
                    </AppText>
                  </View>
                  <ScoreRing percentage={data.score.percentage} />
                </View>
                <AppText variant="caption" color="accent">
                  View breakdown →
                </AppText>
              </Card>
            </Pressable>
          </Settle>
          <Settle delay={120}>
            <Card tier="support" style={{ gap: theme.spacing.sm }}>
              <AppText variant="label" accessibilityRole="header">
                Today’s Progress
              </AppText>
              <View
                style={{ flexDirection: 'row', alignItems: 'flex-start', gap: theme.spacing.sm }}
              >
                <POSIcon name="progress" tone="muted" />
                <View style={{ flex: 1, gap: theme.spacing.xs }}>
                  <AppText color="secondary">No measurable progress yet</AppText>
                  <AppText variant="caption" color="muted">
                    Configured goals are targets, not recorded progress.
                  </AppText>
                </View>
              </View>
            </Card>
          </Settle>
          <Settle delay={160}>
            <View style={{ gap: theme.spacing.sm }}>
              <AppText variant="title" accessibilityRole="header">
                Up Next
              </AppText>
              <Card tier={data.up_next.items.length ? 'primary' : 'support'}>
                {data.up_next.state === 'empty' ? (
                  <View style={{ flexDirection: 'row', gap: theme.spacing.sm }}>
                    <POSIcon name="calendar" tone="muted" />
                    <View style={{ flex: 1, gap: theme.spacing.xs }}>
                      <AppText variant="label">Nothing scheduled next</AppText>
                      <AppText color="secondary">Your day is clear for now.</AppText>
                    </View>
                  </View>
                ) : (
                  <SectionMessage state={data.up_next.state} empty="Nothing scheduled next" />
                )}
                {data.up_next.items.map((entry) => (
                  <ItemRow
                    key={entry.item.plan_item_id}
                    item={entry.item}
                    referenceDate={data.local_date}
                    markOrigin={markOrigin}
                    disabled={!permitted(entry.item.action)}
                    label={entry.label}
                    onView={() => {
                      if (permitted(entry.item.action))
                        open(entry.item.action, entry.item.plan_item_id);
                    }}
                  />
                ))}
              </Card>
            </View>
          </Settle>
          <Settle delay={200}>
            <View
              style={{
                flexDirection: twoColumns ? 'row' : 'column',
                alignItems: 'flex-start',
                gap: theme.spacing.md,
              }}
            >
              <View
                style={{ flex: 1, width: twoColumns ? undefined : '100%', gap: theme.spacing.sm }}
              >
                <AppText variant="title" accessibilityRole="header">
                  Top Priorities
                </AppText>
                <Card>
                  <SectionMessage
                    state={data.top_priorities.state}
                    empty="No active priorities for this day."
                  />
                  {data.top_priorities.items.map((item) => (
                    <ItemRow
                      key={item.plan_item_id}
                      item={item}
                      referenceDate={data.local_date}
                      markOrigin={markOrigin}
                      priority={!item.completed_at}
                      disabled={!permitted(item.action)}
                      onView={() => {
                        if (permitted(item.action)) open(item.action, item.plan_item_id);
                      }}
                    />
                  ))}
                </Card>
              </View>
              <View
                style={{ flex: 1, width: twoColumns ? undefined : '100%', gap: theme.spacing.sm }}
              >
                <AppText variant="title" accessibilityRole="header">
                  Today’s Wins
                </AppText>
                <Card>
                  <SectionMessage
                    state={data.wins.state}
                    empty="Confirmed completions will appear here."
                  />
                  {data.wins.items.map((item) => (
                    <ItemRow
                      key={item.plan_item_id}
                      item={item}
                      referenceDate={data.local_date}
                      markOrigin={markOrigin}
                      disabled={!permitted(item.action)}
                      onView={() => {
                        if (permitted(item.action)) open(item.action, item.plan_item_id);
                      }}
                    />
                  ))}
                </Card>
              </View>
            </View>
          </Settle>
          {permitted('plan_item.create') && (
            <View style={{ gap: theme.spacing.xs }}>
              <AppText variant="label" accessibilityRole="header">
                Quick Actions
              </AppText>
              <Button
                ref={addButton}
                label="Add plan item"
                leadingIcon="add"
                onPress={() => {
                  markOrigin(addButton);
                  open('plan_item.create');
                }}
              />
            </View>
          )}
          <ScoreBreakdown
            visible={breakdown}
            score={data.score}
            onClose={() => setBreakdown(false)}
            onReturnFocus={() => {
              const node = findNodeHandle(scoreButton.current);
              if (node) AccessibilityInfo.setAccessibilityFocus(node);
            }}
          />
        </>
      )}
    </Screen>
  );
}
