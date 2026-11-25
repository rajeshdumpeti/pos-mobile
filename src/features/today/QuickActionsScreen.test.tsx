import { fireEvent, render } from '@testing-library/react-native';
import type { ReactNode } from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { ThemeProvider } from '@/design-system/theme';
import { QuickActionsScreen } from './QuickActionsScreen';

const mockOpen = jest.fn(),
  mockUsePlanAction = jest.fn(() => mockOpen),
  mockVoiceOpen = jest.fn();
let mockVoiceEnabled = false;
jest.mock('./useToday', () => ({
  useToday: () => ({
    query: {
      data: jest.requireActual<typeof import('./testFixtures')>('./testFixtures').todayFixture(),
      error: null,
      isPending: false,
    },
    timezone: 'America/New_York',
    connectivity: 'online',
    refresh: jest.fn(),
  }),
}));
jest.mock('./useReturnFocus', () => ({ useReturnFocus: () => jest.fn() }));
jest.mock('./usePlanAction', () => ({
  usePlanAction: (...args: unknown[]) =>
    (mockUsePlanAction as (...a: unknown[]) => unknown)(...args),
}));
jest.mock('@/features/app-shell/ShellScreens', () => ({
  SecondaryScreen: ({ children }: { children: ReactNode }) => children,
}));
jest.mock('@/features/voice/availability', () => ({
  useVoiceAvailability: () => ({ enabled: mockVoiceEnabled }),
}));
jest.mock('@/features/voice/VoiceEntryProvider', () => ({
  useVoiceEntry: () => ({ open: mockVoiceOpen }),
}));

function view() {
  return render(
    <SafeAreaProvider
      initialMetrics={{
        frame: { x: 0, y: 0, width: 390, height: 844 },
        insets: { top: 47, right: 0, bottom: 34, left: 0 },
      }}
    >
      <ThemeProvider preference="light">
        <QuickActionsScreen />
      </ThemeProvider>
    </SafeAreaProvider>,
  );
}

beforeEach(() => {
  jest.clearAllMocks();
  mockVoiceEnabled = false;
});

test('Quick Log marks its creates as quick_log', () => {
  expect(mockUsePlanAction).not.toHaveBeenCalled();
  const screen = view();
  expect(mockUsePlanAction).toHaveBeenCalledWith(undefined, 'quick_log');
  fireEvent.press(screen.getByRole('button', { name: 'Create a plan item' }));
  expect(mockOpen).toHaveBeenCalledWith('plan_item.create');
});

test('voice is a second option on Quick Log only when available', () => {
  const hidden = view();
  expect(hidden.queryByRole('button', { name: 'Add by voice' })).toBeNull();
  hidden.unmount();
  mockVoiceEnabled = true;
  const screen = view();
  expect(screen.getByRole('button', { name: 'Create a plan item' })).toBeTruthy();
  fireEvent.press(screen.getByRole('button', { name: 'Add by voice' }));
  expect(mockVoiceOpen).toHaveBeenCalledWith(
    'quick_log',
    expect.stringMatching(/^\d{4}-\d{2}-\d{2}$/),
  );
});
