import { createRef } from 'react';
import { act, renderHook, render, waitFor } from '@testing-library/react-native';
import { AccessibilityInfo, Animated, View } from 'react-native';
import * as Native from 'react-native';
import { ThemeProvider } from '@/design-system/theme';
import { ScoreRing } from './ScoreBreakdown';
import { useReturnFocus } from './useReturnFocus';
jest.mock('react-native', () => {
  const actual = jest.requireActual<typeof import('react-native')>('react-native');
  const descriptors = Object.getOwnPropertyDescriptors(actual);
  descriptors.findNodeHandle = {
    value: jest.fn(() => 101),
    writable: true,
    configurable: true,
    enumerable: true,
  };
  return Object.defineProperties({}, descriptors);
});
let mockFocus: (() => void) | undefined;
jest.mock('expo-router', () => ({
  useFocusEffect: (callback: () => void) => {
    mockFocus = callback;
  },
}));
afterEach(() => {
  jest.restoreAllMocks();
  jest.useRealTimers();
});
test('score sweeps once and subsequent confirmed changes do not restart the sweep', async () => {
  jest.spyOn(AccessibilityInfo, 'isReduceMotionEnabled').mockResolvedValue(false);
  const animation = jest.spyOn(Animated, 'timing');
  const view = render(
    <ThemeProvider preference="light">
      <ScoreRing percentage={80} />
    </ThemeProvider>,
  );
  await waitFor(() =>
    expect(animation).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({ toValue: 80, duration: 700 }),
    ),
  );
  view.rerender(
    <ThemeProvider preference="light">
      <ScoreRing percentage={100} />
    </ThemeProvider>,
  );
  expect(animation.mock.calls.filter(([, config]) => config.duration === 700)).toHaveLength(1);
});
test('reduced motion never starts a score sweep', async () => {
  jest.spyOn(AccessibilityInfo, 'isReduceMotionEnabled').mockResolvedValue(true);
  const animation = jest.spyOn(Animated, 'timing');
  render(
    <ThemeProvider preference="dark">
      <ScoreRing percentage={80} />
    </ThemeProvider>,
  );
  await act(async () => {});
  expect(animation.mock.calls.filter(([, config]) => config.duration === 700)).toHaveLength(0);
});
test('focus returns to a launcher and uses fallback if completion removed the original row', async () => {
  jest.spyOn(Native, 'findNodeHandle').mockReturnValue(101);
  const focus = jest.spyOn(AccessibilityInfo, 'setAccessibilityFocus');
  const fallback = createRef<View>(),
    origin = createRef<View>();
  render(
    <View ref={fallback}>
      <View ref={origin} />
    </View>,
  );
  const { result } = renderHook(() => useReturnFocus(fallback));
  expect(mockFocus).toBeDefined();
  act(() => {
    result.current(origin);
    mockFocus?.();
  });
  await waitFor(() => expect(Native.findNodeHandle).toHaveBeenLastCalledWith(origin.current));
  origin.current = null;
  act(() => {
    result.current(origin);
    mockFocus?.();
  });
  await waitFor(() => expect(Native.findNodeHandle).toHaveBeenLastCalledWith(fallback.current));
  expect(focus).toHaveBeenCalledWith(101);
});
