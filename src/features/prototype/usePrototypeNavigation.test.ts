import { act, renderHook } from '@testing-library/react-native';

const mockRouter = {
  push: jest.fn(),
  back: jest.fn(),
  replace: jest.fn(),
  canGoBack: jest.fn(),
};

jest.mock('expo-router', () => ({ useRouter: () => mockRouter }));

import { usePrototypeNavigation } from './usePrototypeNavigation';

const destinations = {
  Today: '/(app)/(tabs)',
  Plan: '/(app)/(tabs)/plan',
  Log: '/(app)/(tabs)/log',
  Focus: '/(app)/(tabs)/focus',
  Review: '/(app)/(tabs)/review',
  Timeline: '/(app)/timeline',
  Nutrition: '/(app)/nutrition',
  Weight: '/(app)/weight',
  Workout: '/(app)/workout',
  Money: '/(app)/money',
  Notifications: '/(app)/notifications',
  Search: '/(app)/search',
  Profile: '/(app)/profile',
  Settings: '/(app)/settings',
} as const;

beforeEach(() => {
  jest.clearAllMocks();
});

test.each(Object.entries(destinations))('maps %s to %s', (name, destination) => {
  const { result } = renderHook(usePrototypeNavigation);

  act(() => result.current.navigate(name));

  expect(mockRouter.push).toHaveBeenCalledWith(destination);
});

test('preserves Quick Add parameters', () => {
  const { result } = renderHook(usePrototypeNavigation);

  act(() => result.current.navigate('QuickAdd', { type: 'meal' }));

  expect(mockRouter.push).toHaveBeenCalledWith({
    pathname: '/modal/quick-add',
    params: { type: 'meal' },
  });
});

test('replaces with the POS tabs when history cannot go back', () => {
  mockRouter.canGoBack.mockReturnValue(false);
  const { result } = renderHook(usePrototypeNavigation);

  act(() => result.current.goBack());

  expect(mockRouter.back).not.toHaveBeenCalled();
  expect(mockRouter.replace).toHaveBeenCalledWith('/(app)/(tabs)');
});

test('uses Router history when it can go back', () => {
  mockRouter.canGoBack.mockReturnValue(true);
  const { result } = renderHook(usePrototypeNavigation);

  act(() => result.current.goBack());

  expect(mockRouter.back).toHaveBeenCalledTimes(1);
  expect(mockRouter.replace).not.toHaveBeenCalled();
});

test('fails explicitly for an unknown prototype destination', () => {
  const { result } = renderHook(usePrototypeNavigation);

  expect(() => result.current.navigate('Unknown')).toThrow(
    'Unknown prototype destination: Unknown',
  );
  expect(mockRouter.push).not.toHaveBeenCalled();
});
