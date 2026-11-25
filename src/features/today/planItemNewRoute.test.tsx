import { render } from '@testing-library/react-native';
import CreatePlanItem from '../../../app/(app)/plan-item-new';

let mockParams: Record<string, string> = {};
const mockScreen = jest.fn((_props: unknown) => null);
jest.mock('expo-router', () => ({ useLocalSearchParams: () => mockParams }));
jest.mock('@/features/today/PlanItemFormScreen', () => ({
  PlanItemFormScreen: (props: unknown) => mockScreen(props),
}));
jest.mock('react-native-safe-area-context', () => ({
  SafeAreaProvider: ({ children }: { children: React.ReactNode }) => children,
}));

beforeEach(() => {
  mockScreen.mockClear();
});

test.each([
  [{ entry: 'quick_log' }, 'quick_log'],
  [{}, 'manual'],
  [{ entry: 'voice' }, 'manual'],
  [{ entry: 'anything-else' }, 'manual'],
  [{ origin: 'plan', selectedDate: '2026-10-02' }, 'manual'],
])('route params %j create with entry source %s', (params, expected) => {
  mockParams = params;
  render(<CreatePlanItem />);
  expect(mockScreen.mock.calls[0]?.[0]).toMatchObject({ entrySource: expected });
});
