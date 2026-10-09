import { forwardRef, type ReactNode } from 'react';
import { View, type ViewProps } from 'react-native';
import Svg, { Circle, Rect, Path, Ellipse, G, Defs, LinearGradient, Stop } from 'react-native-svg';
import { Card, Button, POSIcon, type ButtonProps } from '@/design-system';
import { supportsNativeSvg } from './nativeVisuals';
import { useTheme } from '@/design-system/theme';
import type { RecommendationCode } from './types';
export function PlanningCard({
  tier = 'primary',
  style,
  ...props
}: ViewProps & { tier?: 'intelligence' | 'primary' | 'support' }) {
  const t = useTheme();
  return (
    <Card
      {...props}
      variant={tier === 'intelligence' ? 'elevated' : 'standard'}
      style={[
        {
          borderWidth: 0,
          borderRadius: t.radii.large,
          padding: tier === 'intelligence' ? t.spacing.lg : t.spacing.md,
          backgroundColor:
            tier === 'intelligence'
              ? t.colors.accentSoft
              : tier === 'support'
                ? t.colors.backgroundSecondary
                : t.colors.surfacePrimary,
          gap: t.spacing.md,
        },
        t.isDark
          ? { shadowOpacity: 0 }
          : tier === 'support'
            ? { shadowOpacity: 0, elevation: 0 }
            : {
                shadowOpacity: tier === 'intelligence' ? 0.07 : 0.04,
                shadowRadius: tier === 'intelligence' ? 16 : 12,
                shadowOffset: { width: 0, height: 2 },
              },
        style,
      ]}
    />
  );
}
export type IllustrationKind =
  'priority' | 'scheduled' | 'gettingStarted' | 'insufficient' | 'complete';
export function illustrationFor(code: RecommendationCode): IllustrationKind {
  if (code === 'all_plan_items_complete') return 'complete';
  if (code === 'create_first_plan_item') return 'gettingStarted';
  if (code.startsWith('priority')) return 'priority';
  if (code === 'upcoming' || code === 'past_start') return 'scheduled';
  return 'insufficient';
}
/** POS-owned vector artwork; decorative shapes only, no text or claimed data. */
export function ContextIllustration({
  kind,
  size = 80,
}: {
  kind: IllustrationKind;
  size?: number;
}) {
  const t = useTheme(),
    accent = t.colors.accentPrimary,
    soft = t.colors.accentSelected,
    ink = t.colors.textPrimary,
    surface = t.colors.surfacePrimary;
  if (!supportsNativeSvg()) {
    const icons = {
      priority: 'priority',
      scheduled: 'calendar',
      gettingStarted: 'edit',
      insufficient: 'today',
      complete: 'check',
    } as const;
    return (
      <View
        accessible={false}
        accessibilityElementsHidden
        importantForAccessibility="no-hide-descendants"
        style={{
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: soft,
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <POSIcon name={icons[kind]} size={size / 2} color={accent} />
      </View>
    );
  }
  let artwork: ReactNode;
  switch (kind) {
    case 'priority':
      artwork = (
        <>
          <Circle cx="40" cy="39" r="23" fill={surface} stroke={accent} strokeWidth="2" />
          <Circle cx="40" cy="39" r="14" fill={soft} stroke={accent} strokeWidth="2" />
          <Circle cx="40" cy="39" r="5" fill={accent} />
          <Path
            d="M40 39L59 20M52 19L61 18L60 27"
            stroke={accent}
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </>
      );
      break;
    case 'scheduled':
      artwork = (
        <>
          <Rect
            x="15"
            y="18"
            width="43"
            height="43"
            rx="10"
            fill={surface}
            stroke={accent}
            strokeWidth="2"
          />
          <Path
            d="M15 30H58M27 14V23M46 14V23"
            stroke={accent}
            strokeWidth="3"
            strokeLinecap="round"
          />
          <Circle cx="57" cy="55" r="14" fill={soft} stroke={accent} strokeWidth="2" />
          <Path
            d="M57 47V55L63 59"
            stroke={accent}
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </>
      );
      break;
    case 'gettingStarted':
      artwork = (
        <>
          <Rect
            x="20"
            y="17"
            width="37"
            height="48"
            rx="9"
            transform="rotate(-8 40 40)"
            fill={surface}
            stroke={accent}
            strokeWidth="2"
          />
          <Path
            d="M30 34H45M29 44H43M28 54H38"
            stroke={accent}
            strokeWidth="2.5"
            strokeLinecap="round"
          />
          <Path d="M60 17L62 23L68 25L62 27L60 33L58 27L52 25L58 23Z" fill={accent} />
        </>
      );
      break;
    case 'insufficient':
      artwork = (
        <>
          <Circle cx="40" cy="40" r="24" fill={surface} stroke={accent} strokeWidth="2" />
          <Path
            d="M47 29L44 44L30 51L35 36Z"
            fill={soft}
            stroke={accent}
            strokeWidth="2"
            strokeLinejoin="round"
          />
          <Circle cx="40" cy="40" r="2.5" fill={ink} />
          <Circle cx="16" cy="20" r="2" fill={accent} />
          <Circle cx="65" cy="59" r="2" fill={accent} />
        </>
      );
      break;
    case 'complete':
      artwork = (
        <>
          <Circle cx="40" cy="39" r="24" fill={surface} stroke={accent} strokeWidth="2" />
          <Circle cx="40" cy="39" r="18" fill={soft} />
          <Path
            d="M29 39L37 47L52 31"
            fill="none"
            stroke={accent}
            strokeWidth="3.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </>
      );
      break;
  }
  return (
    <View
      accessible={false}
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      style={{ width: size, height: size }}
    >
      <Svg width={size} height={size} viewBox="0 0 80 80">
        <Defs>
          <LinearGradient id="depth" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0" stopColor={soft} stopOpacity="0.35" />
            <Stop offset="1" stopColor={soft} stopOpacity="0.05" />
          </LinearGradient>
        </Defs>
        <Circle cx="40" cy="40" r="37" fill="url(#depth)" />
        <Ellipse cx="40" cy="69" rx="21" ry="3" fill={accent} opacity="0.1" />
        <G>{artwork}</G>
      </Svg>
    </View>
  );
}

export const PlanningButton = forwardRef<View, ButtonProps>(function PlanningButton(
  { style, ...props },
  ref,
) {
  return <Button {...props} ref={ref} radius="medium" style={style} />;
});
