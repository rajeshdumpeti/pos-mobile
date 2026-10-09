import { useCallback, useRef, type RefObject } from 'react';
import { AccessibilityInfo, findNodeHandle, View } from 'react-native';
import { useFocusEffect } from 'expo-router';
/** Native screen restoration to the actual launching control; contains no domain state. */
export function useReturnFocus(fallback?: RefObject<View | null>) {
  const origin = useRef<RefObject<View | null> | undefined>(undefined);
  useFocusEffect(
    useCallback(() => {
      const target = origin.current;
      origin.current = undefined;
      if (target) {
        const frame = requestAnimationFrame(() => {
          const node = findNodeHandle(target.current ?? fallback?.current ?? null);
          if (node) AccessibilityInfo.setAccessibilityFocus(node);
        });
        return () => cancelAnimationFrame(frame);
      }
    }, [fallback]),
  );
  return (target: RefObject<View | null>) => {
    origin.current = target;
  };
}
