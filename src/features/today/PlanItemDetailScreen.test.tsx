import { fireEvent, render, waitFor } from '@testing-library/react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { ThemeProvider } from '@/design-system/theme';
import * as Haptics from 'expo-haptics';
import { PlanItemDetailScreen } from './PlanItemDetailScreen';
import { itemFixture, itemId } from './testFixtures';
let mockItem = itemFixture();
const mockComplete = jest.fn();
jest.mock('./usePlanItem', () => ({ usePlanItem: () => ({ data: mockItem, isPending: false }) }));
jest.mock('./usePlanMutations', () => ({
  usePlanMutations: () => ({ complete: mockComplete, busy: false }),
}));
jest.mock('./usePlanAction', () => ({ usePlanAction: () => jest.fn() }));
jest.mock('./useReturnFocus', () => ({ useReturnFocus: () => jest.fn() }));
jest.mock('@/navigation', () => ({
  routes: { app: { index: '/' } },
  useSafeNavigation: () => ({ backOrReplace: jest.fn() }),
}));
jest.mock('@/features/auth/integration/useConnectivity', () => ({
  useAuthenticationConnectivity: () => 'online',
}));
jest.mock('expo-haptics', () => ({
  notificationAsync: jest.fn().mockResolvedValue(undefined),
  NotificationFeedbackType: { Success: 'success' },
}));
function screen() {
  return render(
    <SafeAreaProvider
      initialMetrics={{
        frame: { x: 0, y: 0, width: 390, height: 844 },
        insets: { top: 47, right: 0, bottom: 34, left: 0 },
      }}
    >
      <ThemeProvider preference="light">
        <PlanItemDetailScreen id={itemId} />
      </ThemeProvider>
    </SafeAreaProvider>,
  );
}
beforeEach(() => {
  mockItem = itemFixture();
  jest.clearAllMocks();
});
test('completion haptic waits for confirmed success and failed completion gives no haptic', async () => {
  mockComplete
    .mockResolvedValueOnce(undefined)
    .mockResolvedValueOnce(
      itemFixture({ is_priority: false, completed_at: '2026-10-02T14:00:00Z' }),
    );
  const view = screen();
  fireEvent.press(view.getByRole('button', { name: 'Complete plan item' }));
  await waitFor(() => expect(mockComplete).toHaveBeenCalledTimes(1));
  expect(Haptics.notificationAsync).not.toHaveBeenCalled();
  fireEvent.press(view.getByRole('button', { name: 'Complete plan item' }));
  await waitFor(() => expect(Haptics.notificationAsync).toHaveBeenCalledWith('success'));
});
test('confirmed detail is a record with no misleading disabled mutation controls', () => {
  mockItem = itemFixture({ is_priority: false, completed_at: '2026-10-02T14:00:00Z' });
  const view = screen();
  expect(view.getByText('This completion is confirmed.')).toBeTruthy();
  expect(view.getByText('No time scheduled')).toBeTruthy();
  expect(view.queryByRole('button', { name: 'Complete plan item' })).toBeNull();
  expect(view.queryByRole('button', { name: 'Edit' })).toBeNull();
});
