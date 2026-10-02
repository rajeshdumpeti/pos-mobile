import { useCallback, useRef } from 'react';
import { useFocusEffect, useRouter, type Href } from 'expo-router';

/** Reset on returning to the underlying screen, not during repeated taps. */
export function useShellDestination() {
  const router = useRouter();
  const opening = useRef(false);
  useFocusEffect(
    useCallback(() => {
      opening.current = false;
    }, []),
  );
  return (destination: Href) => {
    if (opening.current) return;
    opening.current = true;
    router.navigate(destination);
  };
}
