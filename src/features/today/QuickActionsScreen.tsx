import { useRef } from 'react';
import { View } from 'react-native';
import { useReturnFocus } from './useReturnFocus';
import { PlanningButton as Button } from './TodayVisuals';
import { AppText, LoadingIndicator } from '@/design-system';
import { SecondaryScreen } from '@/features/app-shell/ShellScreens';
import { usePlanAction } from './usePlanAction';
import { VoiceEntryButton } from '@/features/voice/VoiceEntryButton';
import { useToday } from './useToday';
import { FailureNotice } from './PlanItemPage';
import { mapPlanningFailure } from './failure';
export function QuickActionsScreen() {
  const open = usePlanAction(undefined, 'quick_log'),
    { query, refresh, connectivity, timezone } = useToday(),
    origin = useRef<View>(null),
    markOrigin = useReturnFocus();
  return (
    <SecondaryScreen title="Quick Log" body="Plan your day with supported actions.">
      {connectivity === 'offline' && (
        <AppText accessibilityRole="alert">
          You’re offline. No action will send automatically.
        </AppText>
      )}
      {!timezone && (
        <AppText accessibilityRole="alert">
          A valid device timezone is needed to load supported actions.
        </AppText>
      )}
      {query.isPending && timezone && connectivity !== 'offline' && (
        <LoadingIndicator label="Loading supported actions" />
      )}
      {query.error && (
        <>
          <FailureNotice failure={mapPlanningFailure(query.error)} />
          <Button
            label="Reload supported actions"
            variant="secondary"
            onPress={() => void refresh()}
          />
        </>
      )}
      {query.data?.capabilities.actions.includes('plan_item.create') && (
        <>
          <Button
            ref={origin}
            label="Create a plan item"
            leadingIcon="add"
            onPress={() => {
              markOrigin(origin);
              open('plan_item.create');
            }}
          />
          <VoiceEntryButton entry="quick_log" kind="labeled" />
          <AppText color="secondary">
            Open a plan item from Today to view, edit or complete it.
          </AppText>
        </>
      )}
      {query.data && !query.data.capabilities.actions.includes('plan_item.create') && (
        <AppText color="secondary">No supported quick actions are available.</AppText>
      )}
    </SecondaryScreen>
  );
}
