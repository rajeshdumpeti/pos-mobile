import { useEffect, useRef, useState } from 'react';
import { TextInput as NativeTextInput, View } from 'react-native';
import { AppText, Checkbox, TextInput } from '@/design-system';
import { useTheme } from '@/design-system/theme';
import { ScheduleFields } from '@/features/today/ScheduleFields';
import { PlanningButton as Button, PlanningCard } from '@/features/today/TodayVisuals';
import type { Clarification } from '../parser';
import { clarificationPrompt, hintCopy, voiceCopy } from '../copy';
import type { VoiceSessionController } from '../session/controller';
import { pendingClarifications } from '../session/draft';
import type { VoiceSessionState } from '../session/types';

/**
 * The review card. Every value can be edited with the same fields the manual form uses.
 * Add stays disabled until each clarification is resolved. While saving the card locks.
 */
export function ReviewCard({
  state,
  controller,
  onCancel,
  onTypeInstead,
}: {
  state: VoiceSessionState;
  controller: VoiceSessionController;
  onCancel: () => void;
  onTypeInstead: () => void;
}) {
  const theme = useTheme();
  const draft = state.draft;
  const saving = state.phase === 'saving';
  const pending = pendingClarifications(state);
  const titleInput = useRef<NativeTextInput>(null);
  const [openRequest, setOpenRequest] = useState<{ field: 'date' | 'start'; nonce: number }>();
  const needsTitle = pending.some((c) => c.kind === 'title_missing');
  const askedForTitle = useRef(false);
  useEffect(() => {
    if (needsTitle && !askedForTitle.current) {
      askedForTitle.current = true;
      titleInput.current?.focus();
    }
  }, [needsTitle]);
  if (!draft) return null;

  const pick = (field: 'date' | 'start') => {
    if (field === 'start') controller.edit({ scheduled: true });
    setOpenRequest((previous) => ({ field, nonce: (previous?.nonce ?? 0) + 1 }));
  };

  const choices = (clarification: Clarification) => {
    switch (clarification.kind) {
      case 'meridiem':
        return clarification.options.map((option, index) => (
          <Button
            key={option.label}
            variant="secondary"
            label={option.label}
            onPress={() => controller.chooseMeridiem(index)}
          />
        ));
      case 'next_weekday':
        return clarification.options.map((option, index) => (
          <Button
            key={option.date}
            variant="secondary"
            label={option.label}
            onPress={() => controller.chooseWeekday(index)}
          />
        ));
      case 'time_ambiguous_offset':
        return clarification.options.map((option, index) => (
          <Button
            key={option.offset}
            variant="secondary"
            label={`${index === 0 ? 'Earlier' : 'Later'} · ${option.label}`}
            onPress={() => controller.chooseOffset(index)}
          />
        ));
      case 'time_passed':
        return [
          <Button
            key="keep"
            variant="secondary"
            label={clarification.options[0].label}
            onPress={() => controller.keepToday()}
          />,
          <Button
            key="move"
            variant="secondary"
            label={clarification.options[1].label}
            onPress={() => controller.moveToTomorrow()}
          />,
        ];
      case 'midnight':
      case 'time_nonexistent':
        return [
          <Button
            key="time"
            variant="secondary"
            label="Pick a time"
            onPress={() => pick('start')}
          />,
        ];
      case 'date_invalid':
      case 'date_unsupported':
        return [
          <Button
            key="date"
            variant="secondary"
            label="Pick a date"
            onPress={() => pick('date')}
          />,
        ];
      case 'title_missing':
        return [];
    }
  };

  return (
    <View style={{ gap: theme.spacing.md }}>
      <AppText variant="title" accessibilityRole="header">
        Review the task
      </AppText>
      <TextInput
        ref={titleInput}
        label="Title"
        value={draft.title}
        onChangeText={(title) => controller.edit({ title })}
        error={state.fieldErrors.title}
        disabled={saving}
        maxLength={200}
        autoCapitalize="sentences"
        returnKeyType="done"
      />
      {pending.map((clarification) => (
        <PlanningCard key={clarification.kind} tier="support">
          <AppText accessibilityRole="alert" variant="label">
            {clarificationPrompt(clarification)}
          </AppText>
          {choices(clarification)}
        </PlanningCard>
      ))}
      {state.hints.map((hint) => (
        <AppText key={hint} variant="caption" color="muted">
          {hintCopy[hint]}
        </AppText>
      ))}
      <ScheduleFields
        draft={draft}
        disabled={saving}
        errors={state.fieldErrors}
        onChange={(patch) => controller.edit(patch)}
        openRequest={openRequest}
        onPicked={(field) => {
          if (field === 'date' || field === 'endDate') controller.markDatePicked();
        }}
      />
      <PlanningCard>
        <Checkbox
          label="Mark as a priority"
          checked={draft.priority}
          disabled={saving}
          onChange={(priority) => controller.edit({ priority })}
        />
      </PlanningCard>
      <AppText variant="caption" color="muted" accessibilityLabel={`Heard: ${state.heard}`}>
        {voiceCopy.review.heard}: “{state.heard}”
      </AppText>
      {state.notice && (
        <AppText accessibilityRole="alert" color="danger">
          {state.notice}
        </AppText>
      )}
      {saving && state.replays > 0 && (
        <AppText variant="caption" color="muted">
          {voiceCopy.stillTrying}
        </AppText>
      )}
      <View style={{ gap: theme.spacing.xs }}>
        <Button
          label={saving ? voiceCopy.saving : voiceCopy.review.add}
          accessibilityLabel={saving ? voiceCopy.saving : voiceCopy.review.add}
          loading={saving}
          disabled={pending.length > 0 || saving}
          onPress={() => controller.save()}
        />
        {!saving && (
          <>
            <Button label={voiceCopy.review.cancel} variant="secondary" onPress={onCancel} />
            <Button label={voiceCopy.typeInstead} variant="ghost" onPress={onTypeInstead} />
          </>
        )}
      </View>
    </View>
  );
}
