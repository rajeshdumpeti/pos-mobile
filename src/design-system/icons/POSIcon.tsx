import { Ionicons } from '@expo/vector-icons';
import React from 'react';

import { useTheme } from '@/design-system/theme';

const iconMap = {
  add: 'add',
  priority: 'flag-outline',
  progress: 'pulse-outline',
  score: 'ellipse-outline',
  edit: 'create-outline',
  clock: 'time-outline',
  chevron: 'chevron-forward',
  today: 'sunny-outline',
  focus: 'timer-outline',
  review: 'stats-chart-outline',
  notifications: 'notifications-outline',
  alert: 'alert-circle-outline',
  back: 'chevron-back',
  calendar: 'calendar-outline',
  check: 'checkmark',
  close: 'close',
  error: 'warning-outline',
  info: 'information-circle-outline',
  search: 'search-outline',
  showPassword: 'eye-outline',
  hidePassword: 'eye-off-outline',
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
