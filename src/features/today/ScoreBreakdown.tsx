import { useEffect, useRef, useState } from 'react';
import { Animated, Easing } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import { planningVisuals } from '@/design-system/tokens';
import { useReducedMotion } from './motion';
import { AccessibilityInfo, Modal, View, findNodeHandle } from 'react-native';
import { AppText, Screen } from '@/design-system';
import { supportsNativeSvg } from './nativeVisuals';
import { PlanningCard as Card, PlanningButton as Button } from './TodayVisuals';
import { useTheme } from '@/design-system/theme';
import type { TodayResource } from './types';
export function ScoreBreakdown({
  visible,
  score,
  onClose,
  onReturnFocus,
}: {
  visible: boolean;
  score: TodayResource['score'];
  onClose: () => void;
  onReturnFocus: () => void;
}) {
  const theme = useTheme(),
    heading = useRef<View>(null),
    { reduced } = useReducedMotion(),
    [showIds, setShowIds] = useState(false);
  const close = () => {
    onClose();
    requestAnimationFrame(onReturnFocus);
  };
  return (
    <Modal
      visible={visible}
      animationType={reduced ? 'fade' : 'slide'}
      presentationStyle="pageSheet"
      onRequestClose={close}
      onDismiss={onReturnFocus}
      onShow={() => {
        const node = findNodeHandle(heading.current);
        if (node) AccessibilityInfo.setAccessibilityFocus(node);
      }}
    >
      <Screen>
        <View
          ref={heading}
          accessible
          accessibilityRole="header"
          accessibilityLabel="Today’s score breakdown"
        >
          <AppText variant="heading">Score breakdown</AppText>
        </View>
        <AppText color="secondary">
          Daily plan completion only. Every item has the same weight.
        </AppText>
        <Card style={{ gap: theme.spacing.sm }}>
          <AppText variant="title">
            {score.percentage === null ? 'No score yet' : `${score.percentage}%`}
          </AppText>
          <AppText>
            {score.numerator} completed / {score.denominator} eligible items
          </AppText>
          <AppText color="secondary">
            {score.denominator === 0
              ? 'No eligible plan items; a percentage cannot be calculated.'
              : `${score.numerator} ÷ ${score.denominator} × 100, rounded to the nearest whole percent. Halves round up.`}
          </AppText>
        </Card>
        {score.breakdown.map((entry, index) => (
          <Card key={entry.item_id} style={{ gap: theme.spacing.xxs }}>
            <AppText variant="label">Plan item {index + 1}</AppText>
            <AppText>
              {entry.completion_state === 'completed' ? 'Completed' : 'Incomplete'} ·{' '}
              {entry.earned_weight} of {entry.weight} earned
            </AppText>
            <AppText color="secondary" variant="caption">
              Assigned to the current local date.{showIds ? ` Item ID: ${entry.item_id}` : ''}
            </AppText>
          </Card>
        ))}
        <Button
          label={showIds ? 'Hide item identifiers' : 'Show item identifiers'}
          variant="ghost"
          accessibilityState={{ expanded: showIds }}
          onPress={() => setShowIds((value) => !value)}
        />
        <Button label="Close score breakdown" onPress={close} />
      </Screen>
    </Modal>
  );
}
const AnimatedCircle = Animated.createAnimatedComponent(Circle);
export function ScoreRing({ percentage }: { percentage: number | null }) {
  const theme = useTheme(),
    { reduced, ready } = useReducedMotion();
  const size = planningVisuals.ringDiameter,
    width = planningVisuals.ringStroke,
    radius = (size - width) / 2,
    circumference = 2 * Math.PI * radius;
  const progress = useRef(new Animated.Value(percentage ?? 0)).current,
    started = useRef(false);
  useEffect(() => {
    if (percentage === null || !ready) return;
    if (!started.current && !reduced) {
      started.current = true;
      progress.setValue(0);
      const animation = Animated.timing(progress, {
        toValue: percentage,
        duration: 700,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: false,
      });
      animation.start();
      return () => animation.stop();
    }
    started.current = true;
    progress.setValue(percentage);
  }, [percentage, ready, reduced, progress]);
  if (!supportsNativeSvg()) {
    return (
      <View
        accessible={false}
        accessibilityElementsHidden
        importantForAccessibility="no-hide-descendants"
        style={{
          width: size,
          height: size,
          borderRadius: size / 2,
        }}
      >
        <View
          style={{
            position: 'absolute',
            width: size,
            height: size,
            borderRadius: size / 2,
            borderWidth: width,
            borderColor: theme.colors.borderDefault,
          }}
        />
        {percentage !== null &&
          percentage > 0 &&
          (['right', 'left'] as const).map((side) => (
            <View
              key={side}
              style={{
                position: 'absolute',
                top: 0,
                left: side === 'right' ? size / 2 : 0,
                width: size / 2,
                height: size,
                overflow: 'hidden',
              }}
            >
              <Animated.View
                style={{
                  position: 'absolute',
                  left: side === 'right' ? -size / 2 : 0,
                  width: size,
                  height: size,
                  transform: [
                    {
                      rotate: progress.interpolate({
                        inputRange: [0, 50, 100],
                        outputRange:
                          side === 'right'
                            ? ['-180deg', '0deg', '0deg']
                            : ['0deg', '0deg', '180deg'],
                        extrapolate: 'clamp',
                      }),
                    },
                  ],
                }}
              >
                <View
                  style={{
                    position: 'absolute',
                    left: size / 2,
                    width: size / 2,
                    height: size,
                    overflow: 'hidden',
                  }}
                >
                  <View
                    style={{
                      position: 'absolute',
                      left: -size / 2,
                      width: size,
                      height: size,
                      borderRadius: size / 2,
                      borderWidth: width,
                      borderColor: theme.colors.accentPrimary,
                    }}
                  />
                </View>
              </Animated.View>
            </View>
          ))}
      </View>
    );
  }
  return (
    <View
      accessible={false}
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      style={{ width: size, height: size }}
    >
      <Svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={theme.colors.borderDefault}
          strokeWidth={width}
        />
        {percentage !== null && percentage > 0 && (
          <AnimatedCircle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke={theme.colors.accentPrimary}
            strokeWidth={width}
            strokeLinecap="round"
            strokeDasharray={[circumference, circumference]}
            strokeDashoffset={progress.interpolate({
              inputRange: [0, 100],
              outputRange: [circumference, 0],
            })}
            rotation={-90}
            origin={`${size / 2}, ${size / 2}`}
          />
        )}
      </Svg>
    </View>
  );
}
