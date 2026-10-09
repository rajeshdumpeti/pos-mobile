import { useEffect, useState } from 'react';
import { Keyboard, Pressable, TextInput, View } from 'react-native';
import { AppText, IconButton } from '@/design-system';
import { useTheme } from '@/design-system/theme';
export type WallSelection = { date: string; clock: string };
export function CompatiblePicker({
  mode,
  selection,
  onChange,
  onValidityChange,
}: {
  mode: 'date' | 'time';
  selection: WallSelection;
  onChange: (value: WallSelection) => void;
  onValidityChange?: (valid: boolean) => void;
}) {
  const t = useTheme();
  const initialHour = Number(selection.clock.slice(0, 2));
  const [hourText, setHourText] = useState(String(initialHour % 12 || 12).padStart(2, '0'));
  const [minuteText, setMinuteText] = useState(selection.clock.slice(3, 5));
  const [period, setPeriod] = useState(initialHour >= 12 ? 'PM' : 'AM');
  const valid =
    /^\d{1,2}$/.test(hourText) &&
    Number(hourText) >= 1 &&
    Number(hourText) <= 12 &&
    /^\d{1,2}$/.test(minuteText) &&
    Number(minuteText) <= 59;
  useEffect(() => {
    onValidityChange?.(mode === 'date' || valid);
  }, [mode, valid, onValidityChange]);
  const [month, setMonth] = useState(selection.date.slice(0, 7));
  const option = (
    label: string,
    selected: boolean,
    onPress: () => void,
    accessibilityLabel = label,
  ) => (
    <Pressable
      key={accessibilityLabel}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      accessibilityState={{ selected }}
      onPress={onPress}
      style={{
        minHeight: t.accessibility.minimumTouchTarget,
        minWidth: t.accessibility.minimumTouchTarget,
        justifyContent: 'center',
        alignItems: 'center',
        borderRadius: t.radii.small,
        backgroundColor: selected ? t.colors.accentSoft : t.colors.surfacePrimary,
        padding: t.spacing.xs,
      }}
    >
      <AppText color={selected ? 'accent' : 'primary'} variant="label">
        {label}
      </AppText>
    </Pressable>
  );
  if (mode === 'date') {
    const first = new Date(`${month}-01T12:00:00Z`),
      days = new Date(Date.UTC(first.getUTCFullYear(), first.getUTCMonth() + 1, 0)).getUTCDate();
    const move = (delta: number) => {
      const next = new Date(first);
      next.setUTCMonth(next.getUTCMonth() + delta);
      setMonth(next.toISOString().slice(0, 7));
    };
    const monthLabel = new Intl.DateTimeFormat(undefined, {
      timeZone: 'UTC',
      month: 'long',
      year: 'numeric',
    }).format(first);
    const cells = Array.from(
      { length: Math.ceil((first.getUTCDay() + days) / 7) * 7 },
      (_, index) => index - first.getUTCDay() + 1,
    );
    return (
      <View style={{ gap: t.spacing.sm }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: t.spacing.xs }}>
          <IconButton icon="back" accessibilityLabel="Previous month" onPress={() => move(-1)} />
          <AppText
            variant="title"
            accessibilityRole="header"
            style={{ flex: 1, textAlign: 'center' }}
          >
            {monthLabel}
          </AppText>
          <IconButton icon="chevron" accessibilityLabel="Next month" onPress={() => move(1)} />
        </View>
        <View style={{ flexDirection: 'row' }}>
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
            <AppText
              key={day}
              variant="caption"
              color="muted"
              style={{ width: '14.2857%', textAlign: 'center' }}
            >
              {day}
            </AppText>
          ))}
        </View>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
          {cells.map((day, index) => {
            const date = `${month}-${String(day).padStart(2, '0')}`;
            return (
              <View key={`${month}-${index}`} style={{ width: '14.2857%', padding: 1 }}>
                {day > 0 && day <= days ? (
                  option(
                    String(day),
                    selection.date === date,
                    () => onChange({ ...selection, date }),
                    new Intl.DateTimeFormat(undefined, {
                      timeZone: 'UTC',
                      dateStyle: 'full',
                    }).format(new Date(`${date}T12:00:00Z`)),
                  )
                ) : (
                  <View style={{ minHeight: t.accessibility.minimumTouchTarget }} />
                )}
              </View>
            );
          })}
        </View>
      </View>
    );
  }
  const update = (hours: string, minutes: string, nextPeriod: string) => {
    if (
      /^\d{1,2}$/.test(hours) &&
      Number(hours) >= 1 &&
      Number(hours) <= 12 &&
      /^\d{1,2}$/.test(minutes) &&
      Number(minutes) <= 59
    )
      onChange({
        ...selection,
        clock: `${String((Number(hours) % 12) + (nextPeriod === 'PM' ? 12 : 0)).padStart(2, '0')}:${minutes.padStart(2, '0')}`,
      });
  };
  const field = (name: 'Hour' | 'Minute', value: string) => (
    <View style={{ flex: 1, gap: t.spacing.xs }}>
      <AppText variant="label" color="secondary" style={{ textAlign: 'center' }}>
        {name}
      </AppText>
      <TextInput
        accessibilityLabel={name}
        value={value}
        keyboardType="number-pad"
        showSoftInputOnFocus
        selectTextOnFocus
        maxLength={2}
        returnKeyType="done"
        onSubmitEditing={() => Keyboard.dismiss()}
        onChangeText={(text) => {
          const digits = text.replace(/[^0-9]/g, '');
          if (name === 'Hour') {
            setHourText(digits);
            update(digits, minuteText, period);
          } else {
            setMinuteText(digits);
            update(hourText, digits, period);
          }
        }}
        onBlur={() => {
          if (value) {
            if (name === 'Hour') setHourText(value.padStart(2, '0'));
            else setMinuteText(value.padStart(2, '0'));
          }
        }}
        style={{
          minHeight: 88,
          borderRadius: t.radii.medium,
          backgroundColor: t.colors.accentSoft,
          color: t.colors.accentPrimary,
          fontSize: 44,
          fontWeight: '600',
          textAlign: 'center',
          padding: t.spacing.sm,
          fontVariant: ['tabular-nums'],
        }}
      />
    </View>
  );
  return (
    <View style={{ gap: t.spacing.lg }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: t.spacing.sm }}>
        {field('Hour', hourText)}
        <AppText variant="heading" style={{ paddingTop: t.spacing.lg }}>
          :
        </AppText>
        {field('Minute', minuteText)}
      </View>
      <View
        style={{
          flexDirection: 'row',
          padding: t.spacing.xxs,
          gap: t.spacing.xxs,
          borderRadius: t.radii.medium,
          backgroundColor: t.colors.backgroundSecondary,
        }}
      >
        {['AM', 'PM'].map((value) => (
          <View key={value} style={{ flex: 1 }}>
            {option(value, period === value, () => {
              setPeriod(value);
              update(hourText, minuteText, value);
            })}
          </View>
        ))}
      </View>
      <AppText color="secondary" style={{ textAlign: 'center' }}>
        Tap the hour or minute to edit.
      </AppText>
      <View style={{ flexDirection: 'row', gap: t.spacing.xs }}>
        {['00', '15', '30', '45'].map((value) => (
          <View key={value} style={{ flex: 1 }}>
            {option(
              `:${value}`,
              minuteText === value,
              () => {
                setMinuteText(value);
                update(hourText, value, period);
              },
              `Set minutes to ${value}`,
            )}
          </View>
        ))}
      </View>
      {!valid && (
        <AppText color="danger" accessibilityRole="alert">
          Enter an hour from 1 to 12 and minutes from 00 to 59.
        </AppText>
      )}
    </View>
  );
}
