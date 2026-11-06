import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react';
import { BackHandler, Pressable, StyleSheet, View, useWindowDimensions } from 'react-native';
import { useFocusEffect } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, {
  cancelAnimation,
  Easing,
  ReduceMotion,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { useTheme } from '@/design-system/theme';

const panelTiming = {
  duration: 440,
  easing: Easing.inOut(Easing.cubic),
  reduceMotion: ReduceMotion.System,
};

export function ShellModalPanel({
  title,
  onDismiss,
  children,
}: {
  title: string;
  onDismiss: () => void;
  children: (close: () => void) => ReactNode;
}) {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const progress = useSharedValue(1);
  const leaving = useRef(false);
  const [closing, setClosing] = useState(false);
  useEffect(() => {
    progress.value = withTiming(0, panelTiming);
    return () => cancelAnimation(progress);
  }, [progress]);
  const close = useCallback(() => {
    if (leaving.current) return;
    leaving.current = true;
    setClosing(true);
    progress.value = withTiming(1, panelTiming, (finished) => {
      if (finished) runOnJS(onDismiss)();
    });
  }, [onDismiss, progress]);
  useFocusEffect(
    useCallback(() => {
      const subscription = BackHandler.addEventListener('hardwareBackPress', () => {
        close();
        return true;
      });
      return () => subscription.remove();
    }, [close]),
  );
  const panelMotion = useAnimatedStyle(() => ({
    transform: [{ translateX: progress.value * width }],
  }));
  const backdropMotion = useAnimatedStyle(() => ({ opacity: 1 - progress.value }));
  return (
    <View
      style={{ flex: 1, alignItems: 'flex-end' }}
      accessibilityViewIsModal
      pointerEvents={closing ? 'none' : 'auto'}
    >
      <Animated.View style={[StyleSheet.absoluteFill, backdropMotion]}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`Dismiss ${title}`}
          onPress={close}
          style={[StyleSheet.absoluteFill, { backgroundColor: theme.colors.modalScrim }]}
        />
      </Animated.View>
      <Animated.View
        testID="shell-modal-panel"
        style={[
          {
            flex: 1,
            width: Math.min(width * 0.84, 420),
            marginRight: insets.right + theme.spacing.sm,
            marginTop: insets.top + theme.spacing.sm,
            marginBottom: insets.bottom + theme.spacing.sm,
            borderRadius: theme.radii.large,
            backgroundColor: theme.colors.backgroundPrimary,
            overflow: 'hidden',
            borderWidth: 1,
            borderColor: theme.colors.borderDefault,
          },
          panelMotion,
        ]}
      >
        {children(close)}
      </Animated.View>
    </View>
  );
}
