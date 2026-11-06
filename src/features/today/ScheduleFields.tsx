import { useEffect, useRef, useState } from 'react';
import { AccessibilityInfo, Keyboard, Pressable, View, findNodeHandle } from 'react-native';
import { AppText, Checkbox, POSIcon } from '@/design-system';
import { useTheme } from '@/design-system/theme';
import { PlanningCard, PlanningButton as Button } from './TodayVisuals';
import { NativePicker } from './NativePicker';
import {
  friendlyDate,
  friendlyTime,
  friendlyZone,
  pickerDate,
  wallClock,
  wallTimeCandidates,
} from './presentation';
import { localDate, resolveTimeZone } from './time';
import type { PlanDraft, DraftErrors } from './draft';
type Field = 'date' | 'start' | 'end' | 'endDate';
export function ScheduleFields({
  draft,
  disabled,
  errors,
  onChange,
}: {
  draft: PlanDraft;
  disabled: boolean;
  errors: DraftErrors;
  onChange: (patch: Partial<PlanDraft>) => void;
}) {
  const theme = useTheme(),
    [field, setField] = useState<Field>(),
    [choices, setChoices] = useState<{ field: 'start' | 'end'; values: string[] }>(),
    [notice, setNotice] = useState(''),
    [pressedRow, setPressedRow] = useState<Field>(),
    origin = useRef<View>(null),
    rows = useRef<Partial<Record<Field, View | null>>>({}),
    focusFrame = useRef<number>(undefined);
  useEffect(
    () => () => {
      if (focusFrame.current !== undefined) cancelAnimationFrame(focusFrame.current);
      origin.current = null;
    },
    [],
  );
  const validZone = Boolean(draft.timezone),
    endDate = draft.end ? localDate(new Date(draft.end), draft.timezone) : draft.date;
  const close = () => {
    setField(undefined);
    focusFrame.current = requestAnimationFrame(() => {
      const node = findNodeHandle(origin.current);
      if (node) AccessibilityInfo.setAccessibilityFocus(node);
    });
  };
  const choose = (name: 'start' | 'end', date: string, clock: string) => {
    const values = wallTimeCandidates(date, clock, draft.timezone);
    setNotice('');
    setChoices(undefined);
    if (values.length === 0) {
      setNotice('That time does not exist on this date. Choose another time.');
      onChange({ [name]: '' });
    } else if (values.length > 1) {
      onChange({ [name]: '' });
      setChoices({ field: name, values });
    } else onChange({ [name]: values[0] });
  };
  const row = (name: Field, label: string, value: string) => (
    <Pressable
      ref={(node) => {
        rows.current[name] = node;
      }}
      key={name}
      accessibilityRole="button"
      accessibilityLabel={`${label}, ${value}`}
      accessibilityHint={
        name === 'date' || name === 'endDate' ? 'Opens the calendar' : 'Opens the time picker'
      }
      accessibilityState={{ disabled }}
      disabled={disabled || !validZone}
      onPress={() => {
        Keyboard.dismiss();
        origin.current = rows.current[name] ?? null;
        setField(name);
      }}
      onPressIn={() => setPressedRow(name)}
      onPressOut={() => setPressedRow(undefined)}
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: theme.spacing.sm,
        minHeight: 52,
        paddingVertical: theme.spacing.xs,
        opacity: pressedRow === name ? theme.opacity.pressed : 1,
      }}
    >
      <POSIcon name={name === 'date' || name === 'endDate' ? 'calendar' : 'clock'} tone="muted" />
      <View style={{ flex: 1, gap: theme.spacing.xxs }}>
        <AppText variant="label">{label}</AppText>
        <AppText color="secondary">{value}</AppText>
        {name === 'date' && (
          <AppText variant="caption" color="accent">
            Choose date
          </AppText>
        )}
      </View>
      <POSIcon name="chevron" tone="muted" />
    </Pressable>
  );
  const pickerValue =
    field === 'start' && draft.start
      ? new Date(draft.start)
      : field === 'end' && draft.end
        ? new Date(draft.end)
        : pickerDate(field === 'endDate' ? endDate : draft.date, draft.timezone);
  const confirmSelection = (value: { date: string; clock: string }) => {
    if (field === 'date') {
      if (value.date !== draft.date) {
        onChange({ date: value.date, start: '', end: '' });
        if (draft.scheduled) setNotice('Choose times for your new date.');
      }
    } else if (field === 'endDate' && draft.end)
      choose('end', value.date, wallClock(new Date(draft.end), draft.timezone));
    else if (field === 'start' || field === 'end')
      choose(field, field === 'end' ? endDate : draft.date, value.clock);
  };
  return (
    <View style={{ gap: theme.spacing.sm }}>
      <AppText variant="title" accessibilityRole="header">
        When
      </AppText>
      <PlanningCard>
        {row(
          'date',
          'Date',
          validZone ? friendlyDate(draft.date, draft.timezone) : 'Choose a date',
        )}
        <Checkbox
          label="Schedule a time"
          checked={draft.scheduled}
          disabled={disabled}
          onChange={(value) =>
            onChange({ scheduled: value, ...(!value ? { start: '', end: '' } : {}) })
          }
        />
        {draft.scheduled && (
          <>
            <View style={{ height: 1, backgroundColor: theme.colors.divider }} />
            {row(
              'start',
              'Start time',
              draft.start ? friendlyTime(draft.start, draft.timezone) : 'No time selected',
            )}
            {row(
              'end',
              'End time (optional)',
              draft.end ? friendlyTime(draft.end, draft.timezone) : 'No end time',
            )}
            {draft.end && (
              <>
                {row('endDate', 'End date', friendlyDate(endDate, draft.timezone))}
                <Button
                  label="Remove end time"
                  variant="ghost"
                  disabled={disabled}
                  onPress={() => onChange({ end: '' })}
                />
              </>
            )}
          </>
        )}
        {(errors.date || errors.start || errors.end || notice) && (
          <AppText accessibilityRole="alert" color="danger">
            {errors.date ?? errors.start ?? errors.end ?? notice}
          </AppText>
        )}
        {choices && (
          <View style={{ gap: theme.spacing.xs }}>
            <AppText accessibilityRole="alert">
              This time occurs twice. Choose which one you mean.
            </AppText>
            {choices.values.map((value, index) => (
              <Button
                key={value}
                variant="secondary"
                label={`${index === 0 ? 'Earlier' : 'Later'} ${friendlyTime(value, draft.timezone)} · ${new Intl.DateTimeFormat(undefined, { timeZone: draft.timezone, timeZoneName: 'short' }).formatToParts(new Date(value)).find((p) => p.type === 'timeZoneName')?.value}`}
                onPress={() => {
                  onChange({ [choices.field]: value });
                  setChoices(undefined);
                }}
              />
            ))}
          </View>
        )}
      </PlanningCard>
      {draft.scheduled && validZone && draft.timezone !== resolveTimeZone() && (
        <AppText variant="caption" color="muted">
          Times are in {friendlyZone(draft.timezone)}.
        </AppText>
      )}
      {field && validZone && (
        <NativePicker
          label={field === 'date' || field === 'endDate' ? 'Choose date' : 'Choose time'}
          zone={draft.timezone}
          mode={field === 'date' || field === 'endDate' ? 'date' : 'time'}
          value={pickerValue}
          onClose={close}
          onConfirm={(value) =>
            confirmSelection({
              date: localDate(value, draft.timezone),
              clock: wallClock(value, draft.timezone),
            })
          }
          onConfirmWall={confirmSelection}
        />
      )}
    </View>
  );
}
