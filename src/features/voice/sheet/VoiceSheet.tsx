import { View } from 'react-native';
import { AppText, BottomSheet, LoadingIndicator } from '@/design-system';
import { useTheme } from '@/design-system/theme';
import { PlanningButton as Button } from '@/features/today/TodayVisuals';
import { failureCopy, voiceCopy } from '../copy';
import type { VoiceSessionController } from '../session/controller';
import type { VoiceSessionState } from '../session/types';
import { ListeningView } from './ListeningView';
import { ReviewCard } from './ReviewCard';

export type VoiceSheetActions = {
  openSettings: () => void;
  typeInstead: () => void;
  viewToday: () => void;
};

/** One shared sheet for every entry point. Content depends only on the session phase. */
export function VoiceSheet({
  visible,
  state,
  controller,
  actions,
}: {
  visible: boolean;
  state: VoiceSessionState;
  controller: VoiceSessionController;
  actions: VoiceSheetActions;
}) {
  const theme = useTheme();
  const cancellable = !['saving', 'unknown_outcome'].includes(state.phase);
  const close = () => (cancellable ? controller.cancel() : undefined);
  return (
    <BottomSheet
      visible={visible}
      accessibilityLabel={voiceCopy.sheetLabel}
      onRequestClose={cancellable ? close : undefined}
    >
      {state.phase === 'consent' && (
        <View style={{ gap: theme.spacing.md }}>
          <AppText variant="title" accessibilityRole="header">
            {voiceCopy.consent.heading}
          </AppText>
          <AppText>{voiceCopy.consent.body}</AppText>
          <View style={{ gap: theme.spacing.xs }}>
            <Button
              label={voiceCopy.consent.continue}
              onPress={() => controller.continueConsent()}
            />
            <Button label={voiceCopy.consent.notNow} variant="secondary" onPress={close} />
          </View>
        </View>
      )}
      {state.phase === 'requesting_permission' && (
        <View style={{ gap: theme.spacing.md }}>
          <LoadingIndicator label="Starting the microphone" />
          <Button label={voiceCopy.listening.cancel} variant="secondary" onPress={close} />
        </View>
      )}
      {state.phase === 'listening' && (
        <ListeningView
          started={state.listeningStartedAt}
          words={state.partial}
          onStop={() => controller.stop()}
          onCancel={close}
        />
      )}
      {state.phase === 'parsing' && <LoadingIndicator label={voiceCopy.parsing} />}
      {(state.phase === 'review' || state.phase === 'clarifying' || state.phase === 'saving') && (
        <ReviewCard
          state={state}
          controller={controller}
          onCancel={close}
          onTypeInstead={actions.typeInstead}
        />
      )}
      {state.phase === 'unknown_outcome' && (
        <View style={{ gap: theme.spacing.md }}>
          <AppText variant="title" accessibilityRole="header">
            {voiceCopy.unknownOutcome}
          </AppText>
          <View style={{ gap: theme.spacing.xs }}>
            <Button label={voiceCopy.tryAgain} onPress={() => controller.retryUnknown()} />
            <Button label={voiceCopy.viewToday} variant="secondary" onPress={actions.viewToday} />
          </View>
        </View>
      )}
      {state.phase === 'failed' && state.failure && (
        <View style={{ gap: theme.spacing.md }}>
          <AppText accessibilityRole="alert" variant="title">
            {failureCopy(state.failure)}
          </AppText>
          <View style={{ gap: theme.spacing.xs }}>
            {state.failure.kind === 'permission_denied' ? (
              <>
                <Button label={voiceCopy.openSettings} onPress={actions.openSettings} />
                <Button
                  label={voiceCopy.typeInstead}
                  variant="secondary"
                  onPress={actions.typeInstead}
                />
              </>
            ) : state.failure.kind === 'save_conflict' ||
              state.failure.kind === 'save_unavailable' ||
              state.failure.kind === 'no_timezone' ? (
              <>
                <Button label={voiceCopy.viewToday} onPress={actions.viewToday} />
                <Button label={voiceCopy.close} variant="secondary" onPress={close} />
              </>
            ) : (
              <>
                <Button label={voiceCopy.tryAgain} onPress={() => controller.tryAgain()} />
                <Button
                  label={voiceCopy.typeInstead}
                  variant="secondary"
                  onPress={actions.typeInstead}
                />
              </>
            )}
          </View>
        </View>
      )}
    </BottomSheet>
  );
}
