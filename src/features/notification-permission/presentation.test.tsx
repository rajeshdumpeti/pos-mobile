import { act, renderHook } from '@testing-library/react-native';
import { createRef } from 'react';
import { View } from 'react-native';
import { useNotificationPermission } from './presentation';
import { routes } from '@/navigation';
const mockNavigate = jest.fn(),
  mockFocus = jest.fn();
let mockFocused!: () => void;
jest.mock('expo-router', () => ({
  useRouter: () => ({ navigate: mockNavigate }),
  useFocusEffect: (callback: () => void) => {
    mockFocused = callback;
  },
}));
jest.mock('@/features/today/useReturnFocus', () => ({ useReturnFocus: () => mockFocus }));
test('contextual opener records real focus origin, uses a protected parameter-free route and suppresses duplicate taps', () => {
  const { result } = renderHook(useNotificationPermission);
  const origin = createRef<View>();
  act(() => {
    result.current(origin);
    result.current(origin);
  });
  expect(mockFocus).toHaveBeenCalledWith(origin);
  expect(mockNavigate).toHaveBeenCalledTimes(1);
  expect(mockNavigate).toHaveBeenCalledWith(routes.app.notificationPermission);
  act(() => mockFocused());
  act(() => result.current(origin));
  expect(mockNavigate).toHaveBeenCalledTimes(2);
});
