import { useEffect, useRef, useState, type ReactNode } from 'react';
import { AccessibilityInfo, Animated, Easing } from 'react-native';
export function useReducedMotion() {
  const [reduced, setReduced] = useState(true),
    [ready, setReady] = useState(false);
  useEffect(() => {
    let active = true;
    void AccessibilityInfo.isReduceMotionEnabled()
      .then((value) => {
        if (active) {
          setReduced(value);
          setReady(true);
        }
      })
      .catch(() => {
        if (active) setReady(true);
      });
    const sub = AccessibilityInfo.addEventListener('reduceMotionChanged', setReduced);
    return () => {
      active = false;
      sub.remove();
    };
  }, []);
  return { reduced, ready };
}
export function Settle({
  children,
  delay = 0,
  completion = false,
}: {
  children: ReactNode;
  delay?: number;
  completion?: boolean;
}) {
  const { reduced, ready } = useReducedMotion(),
    progress = useRef(new Animated.Value(1)).current,
    started = useRef(false);
  useEffect(() => {
    if (!ready) return;
    if (started.current) {
      if (reduced) progress.setValue(1);
      return;
    }
    started.current = true;
    progress.setValue(0);
    const animation = Animated.timing(progress, {
      toValue: 1,
      duration: reduced ? 120 : completion ? 360 : Math.max(80, 250 - delay),
      delay: reduced ? 0 : delay,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    });
    animation.start();
    return () => animation.stop();
  }, [progress, ready, reduced, delay, completion]);
  return (
    <Animated.View
      style={{
        opacity: progress,
        transform: reduced
          ? []
          : [{ translateY: progress.interpolate({ inputRange: [0, 1], outputRange: [6, 0] }) }],
      }}
    >
      {children}
    </Animated.View>
  );
}
