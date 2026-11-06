import type { PlanContext } from '@/features/plan/calendar';
import { useEffect, useRef, useState } from 'react';
import { AccessibilityInfo, View, useWindowDimensions } from 'react-native';
import * as Haptics from 'expo-haptics';
import { useAuthenticationConnectivity } from '@/features/auth/integration/useConnectivity';
import { AppText, POSIcon, ErrorState, LoadingIndicator } from '@/design-system';
import { useTheme } from '@/design-system/theme';
import { usePlanItem } from './usePlanItem';
import { usePlanMutations } from './usePlanMutations';
import { usePlanAction } from './usePlanAction';
import { PlanItemPage, FailureNotice } from './PlanItemPage';
import { mapPlanningFailure } from './failure';
import { friendlyDate, friendlyTime, friendlyCompletion, friendlyZone } from './presentation';
import { resolveTimeZone, localDate } from './time';
import { PlanningCard as Card, PlanningButton as Button } from './TodayVisuals';
import { Settle } from './motion';
import { useReturnFocus } from './useReturnFocus';
export function validPlanId(value: unknown): string | undefined {
  return typeof value === 'string' &&
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value)
    ? value
    : undefined;
}
export function PlanItemDetailScreen({
  id: input,
  context,
}: {
  id?: string | string[];
  context?: PlanContext;
}) {
  const id = validPlanId(input),
    query = usePlanItem(id),
    mutations = usePlanMutations(id),
    open = usePlanAction(context),
    theme = useTheme(),
    connectivity = useAuthenticationConnectivity();
  const { fontScale } = useWindowDimensions();
  const item = query.data,
    editButton = useRef<View>(null),
    markOrigin = useReturnFocus(),
    [zoneVisible, setZoneVisible] = useState(false);
  const mounted = useRef(true);
  useEffect(
    () => () => {
      mounted.current = false;
    },
    [],
  );
  useEffect(() => {
    if (mutations.failure) AccessibilityInfo.announceForAccessibility(mutations.failure.message);
  }, [mutations.failure]);
  const complete = () =>
    void mutations.complete(item!.version).then((result) => {
      if (result && mounted.current) {
        AccessibilityInfo.announceForAccessibility('Plan item completion confirmed.');
        void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {
          /* A haptic failure cannot change confirmed domain state. */
        });
      }
    });
  const row = (label: string, value: string, icon: 'calendar' | 'clock' | 'check') => (
    <View
      key={label}
      style={{
        flexDirection: 'row',
        alignItems: 'flex-start',
        gap: theme.spacing.sm,
        paddingVertical: theme.spacing.xs,
      }}
    >
      <POSIcon name={icon} tone="muted" />
      <View style={{ flex: 1, gap: theme.spacing.xxs }}>
        <AppText variant="caption" color="muted">
          {label}
        </AppText>
        <AppText>{value}</AppText>
      </View>
    </View>
  );
  const disabled = mutations.reviewRequired || query.isError || connectivity === 'offline';
  return (
    <PlanItemPage
      context={context}
      title="Plan item"
      busy={mutations.busy}
      footer={
        item && !item.completed_at ? (
          <View style={{ gap: theme.spacing.xs }}>
            <Button
              label="Complete plan item"
              leadingIcon="check"
              loading={mutations.busy}
              disabled={disabled}
              onPress={complete}
            />
            <Button
              ref={editButton}
              label="Edit"
              leadingIcon="edit"
              variant="ghost"
              disabled={mutations.busy || disabled}
              onPress={() => {
                markOrigin(editButton);
                open('plan_item.update', item.id);
              }}
            />
          </View>
        ) : undefined
      }
    >
      {!id && (
        <ErrorState title="Item unavailable" message="Open a supported plan item from Today." />
      )}
      {id && query.isPending && <LoadingIndicator label="Loading plan item" />}
      {query.error && <FailureNotice failure={mapPlanningFailure(query.error)} />}
      {id && query.error && (
        <Button label="Reload plan item" variant="secondary" onPress={() => void query.refetch()} />
      )}
      {connectivity === 'offline' && (
        <AppText accessibilityRole="alert">
          You’re offline. Confirmed information may be out of date; changes won’t send
          automatically.
        </AppText>
      )}
      {item && (
        <>
          <View style={{ gap: theme.spacing.md }}>
            <AppText variant={fontScale > 1.4 ? 'title' : 'heading'} accessibilityRole="header">
              {item.title}
            </AppText>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: theme.spacing.xs }}>
              <View
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: theme.spacing.xs,
                  alignSelf: 'flex-start',
                  paddingVertical: theme.spacing.xs,
                  paddingHorizontal: theme.spacing.sm,
                  borderRadius: theme.radii.pill,
                  backgroundColor: item.completed_at
                    ? theme.colors.successSoft
                    : theme.colors.backgroundSecondary,
                }}
              >
                <POSIcon
                  name={item.completed_at ? 'check' : 'calendar'}
                  color={item.completed_at ? theme.colors.success : theme.colors.textSecondary}
                />
                <AppText variant="label">{item.completed_at ? 'Completed' : 'Planned'}</AppText>
              </View>
              {item.is_priority && (
                <View
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: theme.spacing.xs,
                    paddingVertical: theme.spacing.xs,
                    paddingHorizontal: theme.spacing.sm,
                    borderRadius: theme.radii.pill,
                    backgroundColor: theme.colors.accentSoft,
                  }}
                >
                  <POSIcon name="priority" tone="accent" />
                  <AppText variant="label" color="accent">
                    Priority
                  </AppText>
                </View>
              )}
            </View>
          </View>
          <Card>
            {row('Assigned', friendlyDate(item.scheduled_for_date, item.timezone), 'calendar')}
            <View style={{ height: 1, backgroundColor: theme.colors.divider }} />
            {row(
              'Scheduled',
              item.scheduled_start_at
                ? `${friendlyTime(item.scheduled_start_at, item.timezone)}${item.scheduled_end_at ? ` – ${friendlyTime(item.scheduled_end_at, item.timezone)}` : ''}`
                : 'No time scheduled',
              'clock',
            )}
            {item.scheduled_end_at &&
              item.scheduled_start_at &&
              localDate(new Date(item.scheduled_end_at), item.timezone) !==
                localDate(new Date(item.scheduled_start_at), item.timezone) && (
                <AppText variant="caption" color="secondary">
                  Ends {friendlyCompletion(item.scheduled_end_at, item.timezone)}
                </AppText>
              )}
            {item.timezone !== resolveTimeZone() && (
              <>
                <Button
                  label="Time zone details"
                  variant="ghost"
                  onPress={() => setZoneVisible((value) => !value)}
                  accessibilityState={{ expanded: zoneVisible }}
                />
                {zoneVisible && (
                  <AppText color="secondary">
                    {friendlyZone(item.timezone)} · {item.timezone}
                  </AppText>
                )}
              </>
            )}
          </Card>
          {item.completed_at && (
            <Settle key={`completed:${item.id}`} completion>
              <Card tier="support">
                <View
                  style={{ flexDirection: 'row', gap: theme.spacing.sm, alignItems: 'flex-start' }}
                >
                  <View
                    style={{
                      padding: theme.spacing.sm,
                      borderRadius: theme.radii.pill,
                      backgroundColor: theme.colors.successSoft,
                    }}
                  >
                    <POSIcon name="check" color={theme.colors.success} size={24} />
                  </View>
                  <View style={{ flex: 1, gap: theme.spacing.xs }}>
                    <AppText variant="title">Completed</AppText>
                    <AppText>{friendlyCompletion(item.completed_at, item.timezone)}</AppText>
                    <AppText variant="caption" color="muted">
                      This completion is confirmed.
                    </AppText>
                  </View>
                </View>
              </Card>
            </Settle>
          )}
          <FailureNotice failure={mutations.failure} />
          {mutations.reviewRequired && (
            <Card>
              <AppText accessibilityRole="alert">
                Review the current item above. No local completion was assumed.
              </AppText>
              {!mutations.reviewReady && (
                <Button
                  label="Load latest item for review"
                  onPress={() =>
                    void query.refetch().then((result) => {
                      if (result.data && !result.isError) mutations.confirmReview();
                    })
                  }
                />
              )}
              <Button
                label="I reviewed the latest item"
                variant="secondary"
                disabled={!mutations.reviewReady || query.isError}
                onPress={mutations.acknowledgeReview}
              />
            </Card>
          )}
        </>
      )}
    </PlanItemPage>
  );
}
