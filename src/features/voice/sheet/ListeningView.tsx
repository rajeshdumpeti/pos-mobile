import { useEffect, useState } from 'react';
import { View } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import { AppText } from '@/design-system';
import { useTheme } from '@/design-system/theme';
import { PlanningButton as Button } from '@/features/today/TodayVisuals';
import { voiceCopy } from '../copy';
import { VOICE_LIMITS } from '../session/controller';

const SIZE = 132;
const STROKE = 8;

/** Live words and a 30-second countdown ring. Words are shown on screen only. */
export function ListeningView({
  started,
  words,
  onStop,
  onCancel,
}: {
  /** Epoch ms when listening began; null while the microphone is still starting. */
  started: number | null;
  words: string;
  onStop: () => void;
  onCancel: () => void;
}) {
  const theme = useTheme();
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    if (started === null) return;
    const timer = setInterval(() => setNow(Date.now()), 250);
    return () => clearInterval(timer);
  }, [started]);
  const elapsed = started === null ? 0 : Math.max(0, now - started);
  const left = Math.max(0, VOICE_LIMITS.maxDurationMs - elapsed);
  const seconds = Math.ceil(left / 1000);
  const radius = (SIZE - STROKE) / 2;
  const circumference = 2 * Math.PI * radius;
  return (
    <View style={{ gap: theme.spacing.md, alignItems: 'center' }}>
      <AppText variant="title" accessibilityRole="header">
        {voiceCopy.listening.label}
      </AppText>
      <View
        accessible
        accessibilityRole="timer"
        accessibilityLabel={`${seconds} seconds left`}
        style={{ width: SIZE, height: SIZE, alignItems: 'center', justifyContent: 'center' }}
      >
        <Svg width={SIZE} height={SIZE} style={{ position: 'absolute' }}>
          <Circle
            cx={SIZE / 2}
            cy={SIZE / 2}
            r={radius}
            stroke={theme.colors.divider}
            strokeWidth={STROKE}
            fill="none"
          />
          <Circle
            cx={SIZE / 2}
            cy={SIZE / 2}
            r={radius}
            stroke={theme.colors.accentPrimary}
            strokeWidth={STROKE}
            strokeLinecap="round"
            fill="none"
            strokeDasharray={`${circumference} ${circumference}`}
            strokeDashoffset={circumference * (1 - left / VOICE_LIMITS.maxDurationMs)}
            transform={`rotate(-90 ${SIZE / 2} ${SIZE / 2})`}
          />
        </Svg>
        <AppText variant="title">{seconds}</AppText>
      </View>
      <View style={{ minHeight: 72, alignSelf: 'stretch' }}>
        <AppText accessibilityLabel={words ? `Heard so far: ${words}` : voiceCopy.listening.hint}>
          {words || voiceCopy.listening.hint}
        </AppText>
      </View>
      <View style={{ alignSelf: 'stretch', gap: theme.spacing.xs }}>
        <Button label={voiceCopy.listening.stop} onPress={onStop} />
        <Button label={voiceCopy.listening.cancel} variant="secondary" onPress={onCancel} />
      </View>
    </View>
  );
}
