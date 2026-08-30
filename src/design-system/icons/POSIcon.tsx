import { Ionicons } from '@expo/vector-icons';
import React from 'react';

import { useTheme } from '@/design-system/theme';

const iconMap = {
  add: 'add',
  alert: 'alert-circle-outline',
  apple: 'logo-apple',
  back: 'chevron-back',
  calendar: 'calendar-outline',
  check: 'checkmark',
  close: 'close',
  email: 'mail-outline',
  error: 'warning-outline',
  eye: 'eye-outline',
  eyeOff: 'eye-off-outline',
  face: 'scan-outline',
  fingerprint: 'finger-print-outline',
  focus: 'timer-outline',
  google: 'logo-google',
  info: 'information-circle-outline',
  key: 'key-outline',
  leaf: 'leaf-outline',
  lock: 'lock-closed-outline',
  log: 'add-circle-outline',
  menu: 'grid-outline',
  review: 'stats-chart-outline',
  search: 'search-outline',
  shield: 'shield-checkmark-outline',
  today: 'sunny-outline',
} as const satisfies Record<string, React.ComponentProps<typeof Ionicons>['name']>;

export type POSIconName = keyof typeof iconMap;
export type POSIconTone = 'accent' | 'primary' | 'secondary' | 'muted' | 'danger';

export type POSIconProps = {
  name: POSIconName;
  size?: number;
  tone?: POSIconTone;
  color?: string;
  accessibilityLabel?: string;
  testID?: string;
};

export function POSIcon({
  name,
  size = 20,
  tone = 'primary',
  color,
  accessibilityLabel,
  testID,
}: POSIconProps) {
  const { colors } = useTheme();
  const tones = {
    accent: colors.accentPrimary,
    primary: colors.textPrimary,
    secondary: colors.textSecondary,
    muted: colors.textMuted,
    danger: colors.danger,
  };
  const resolvedName = iconMap[name] ?? 'help-circle-outline';

  return (
    <Ionicons
      testID={testID}
      name={resolvedName}
      size={size}
      color={color ?? tones[tone]}
      accessible={Boolean(accessibilityLabel)}
      accessibilityRole={accessibilityLabel ? 'image' : undefined}
      accessibilityLabel={accessibilityLabel}
      accessibilityElementsHidden={!accessibilityLabel}
      importantForAccessibility={accessibilityLabel ? 'yes' : 'no-hide-descendants'}
    />
  );
}
