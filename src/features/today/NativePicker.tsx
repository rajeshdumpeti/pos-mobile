import { lazy, Suspense, useRef, useState } from 'react';
import { AccessibilityInfo, Keyboard, Modal, Platform, View, findNodeHandle } from 'react-native';
import { supportsNativePicker } from './nativeVisuals';
import { CompatiblePicker, type WallSelection } from './CompatiblePicker';
import { localDate } from './time';
import { pickerDate, wallClock, wallTimeCandidates } from './presentation';
import { AppText, Button, Screen } from '@/design-system';
import { useTheme } from '@/design-system/theme';
import { useReducedMotion } from './motion';
const DateTimePicker = lazy(async () => {
  // eslint-disable-next-line @typescript-eslint/no-require-imports -- Missing Android native modules throw on import; load only after checking the running client.
  const pickerModule: typeof import('./SupportedNativePicker') = require('./SupportedNativePicker');
  return pickerModule;
});
export function NativePicker({
  mode,
  value,
  zone,
  label,
  onConfirm,
  onClose,
  onConfirmWall,
}: {
  mode: 'date' | 'time';
  value: Date;
  zone: string;
  label: string;
  onConfirm: (value: Date) => void;
  onClose: () => void;
  onConfirmWall?: (value: WallSelection) => void;
}) {
  const theme = useTheme(),
    { reduced } = useReducedMotion(),
    [valid, setValid] = useState(true),
    [selected, setSelected] = useState(value),
    heading = useRef<View>(null),
    [visible, setVisible] = useState(true),
    [wall, setWall] = useState<WallSelection>({
      date: localDate(value, zone),
      clock: wallClock(value, zone),
    });
  const native = supportsNativePicker(mode);
  const dismiss = () => {
    Keyboard.dismiss();
    setVisible(false);
    if (Platform.OS !== 'ios') onClose();
  };
  const matches = mode === 'time' ? wallTimeCandidates(wall.date, wall.clock, zone) : [];
  const picker = native ? (
    <Suspense fallback={<AppText>Opening picker…</AppText>}>
      <DateTimePicker
        value={selected}
        mode={mode}
        display={Platform.OS === 'ios' ? (mode === 'date' ? 'inline' : 'spinner') : 'default'}
        timeZoneName={zone}
        themeVariant={theme.mode}
        accentColor={theme.colors.accentPrimary}
        style={
          Platform.OS === 'ios'
            ? { alignSelf: 'stretch', height: mode === 'date' ? 360 : 216 }
            : undefined
        }
        onChange={(event, next) => {
          if (Platform.OS === 'android') {
            if (event.type === 'set' && next) onConfirm(next);
            onClose();
          } else if (next) setSelected(next);
        }}
      />
    </Suspense>
  ) : (
    <CompatiblePicker mode={mode} selection={wall} onChange={setWall} onValidityChange={setValid} />
  );
  if (native && Platform.OS === 'android') return picker;
  return (
    <Modal
      visible={visible}
      presentationStyle="pageSheet"
      animationType={reduced ? 'fade' : 'slide'}
      onRequestClose={dismiss}
      onDismiss={onClose}
      onShow={() => {
        const node = findNodeHandle(heading.current);
        if (node) AccessibilityInfo.setAccessibilityFocus(node);
      }}
    >
      <Screen
        keyboardSafe
        footer={
          <View style={{ gap: theme.spacing.xs }}>
            <Button
              label="Done"
              disabled={
                !valid || (!native && !onConfirmWall && mode === 'time' && matches.length !== 1)
              }
              onPress={() => {
                if (native) onConfirm(selected);
                else if (onConfirmWall) onConfirmWall(wall);
                else if (mode === 'date') onConfirm(pickerDate(wall.date, zone));
                else if (matches[0]) onConfirm(new Date(matches[0]));
                dismiss();
              }}
            />
            <Button label="Cancel" variant="ghost" onPress={dismiss} />
          </View>
        }
        contentContainerStyle={{ gap: theme.spacing.xl }}
      >
        <View ref={heading} accessible accessibilityRole="header" accessibilityLabel={label}>
          <AppText variant="title">{label}</AppText>
        </View>
        {picker}
        {!native && !onConfirmWall && mode === 'time' && matches.length !== 1 && (
          <AppText color="danger" accessibilityRole="alert">
            Choose a time that occurs once on this date.
          </AppText>
        )}
      </Screen>
    </Modal>
  );
}
