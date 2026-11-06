import { useEffect, useState } from 'react';
import { AccessibilityInfo } from 'react-native';
import { useReducedMotion } from 'react-native-reanimated';

// Reanimated supplies the native preference synchronously for the first entrance.
// Also follow system changes while mounted.
export function useAuthReducedMotion() {
  const initialReduced = useReducedMotion();
  const [reduced, setReduced] = useState(initialReduced);
  useEffect(() => {
    let active = true;
    let changed = false;
    const subscription = AccessibilityInfo.addEventListener('reduceMotionChanged', (value) => {
      changed = true;
      setReduced(value);
    });
    void Promise.resolve(AccessibilityInfo.isReduceMotionEnabled?.() ?? false)
      .then((value) => {
        if (active && !changed) setReduced(value);
      })
      .catch(() => undefined);
    return () => {
      active = false;
      subscription?.remove?.();
    };
  }, []);
  return reduced;
}
