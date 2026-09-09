import { PropsWithChildren } from 'react';
import Animated, { FadeIn, ReduceMotion } from 'react-native-reanimated';
import { useTheme } from '@/design-system/theme';
import { useAuthReducedMotion } from '../presentation/useAuthMotion';

export function AuthEntrance({
  children,
  artwork = false,
}: PropsWithChildren<{ artwork?: boolean }>) {
  const theme = useTheme();
  const reduced = useAuthReducedMotion();
  return (
    <Animated.View
      testID={artwork ? 'auth-artwork-motion' : 'auth-content-motion'}
      entering={
        reduced
          ? undefined
          : FadeIn.duration(
              artwork ? theme.motionDuration.deliberate : theme.motionDuration.standard,
            ).reduceMotion(ReduceMotion.System)
      }
    >
      {children}
    </Animated.View>
  );
}
