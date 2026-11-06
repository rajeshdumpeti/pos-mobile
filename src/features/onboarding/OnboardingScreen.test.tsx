import React from 'react';
import { fireEvent, render } from '@testing-library/react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { ThemeProvider } from '@/design-system/theme';
const mockSave = { isPending: false, isError: false, mutateAsync: jest.fn().mockResolvedValue({}) };
const mockComplete = { isPending: false, isError: false, mutateAsync: jest.fn() };
const mockData = {
  status: 'not_started',
  contract_version: '1.0',
  version: 0,
  priority_life_areas: [],
  unit_preference: { value: null, confirmed: false },
  currency_preference: { value: null, confirmed: false },
  goals: {},
  integration_preferences: {},
  notification_preferences: {},
  requirements: {
    priority_life_areas_satisfied: false,
    unit_system_satisfied: false,
    currency_satisfied: false,
    ready_to_complete: false,
  },
  recommended_next_action: 'select_priority_life_areas',
  completed_at: null,
  configuration: {
    priority_life_areas: ['health'],
    unit_systems: ['metric'],
    currencies: ['USD'],
    optional_goal_fields: [],
    integration_identifiers: ['calendar'],
    integration_preference_values: ['interested', 'not_interested', 'deferred'],
    notification_identifiers: ['water'],
    notification_preference_values: ['enabled', 'disabled', 'deferred'],
    routine_creation_supported: false,
  },
};
jest.mock('./useOnboarding', () => ({
  useOnboarding: () => ({
    query: { data: mockData, isPending: false, isError: false, refetch: jest.fn() },
    save: mockSave,
    complete: mockComplete,
    failure: undefined,
    reviewRequired: false,
    acknowledgeReview: jest.fn(),
  }),
}));
jest.mock('expo-router', () => ({ useRouter: () => ({ replace: jest.fn() }) }));
import { OnboardingScreen } from './OnboardingScreen';
const metrics = {
  frame: { x: 0, y: 0, width: 390, height: 844 },
  insets: { top: 0, right: 0, bottom: 0, left: 0 },
};
const view = () =>
  render(
    <SafeAreaProvider initialMetrics={metrics}>
      <ThemeProvider preference="light">
        <OnboardingScreen />
      </ThemeProvider>
    </SafeAreaProvider>,
  );
beforeEach(() => {
  jest.clearAllMocks();
  Object.assign(mockData, {
    status: 'not_started',
    version: 0,
    recommended_next_action: 'select_priority_life_areas',
    unit_preference: { value: null, confirmed: false },
    currency_preference: { value: null, confirmed: false },
  });
  Object.assign(mockData.requirements, { ready_to_complete: false });
});
test('educational screens advance without mutation and progress is accessible', () => {
  const screen = view();
  expect(screen.getByRole('header', { name: 'The POS Promise' })).toBeTruthy();
  expect(
    screen.getByRole('progressbar', { name: 'Step 1 of 8' }).props.accessibilityValue,
  ).toMatchObject({ now: 1, max: 8 });
  fireEvent.press(screen.getByRole('button', { name: 'Continue' }));
  expect(screen.getByRole('header', { name: 'How POS Works' })).toBeTruthy();
  expect(mockSave.mutateAsync).not.toHaveBeenCalled();
  fireEvent.press(screen.getByRole('button', { name: 'Continue' }));
  expect(screen.getByRole('header', { name: 'What do you want to improve?' })).toBeTruthy();
  expect(screen.queryByRole('button', { name: 'Skip for now' })).toBeNull();
  expect(screen.getByRole('button', { name: 'Continue' }).props.accessibilityState.disabled).toBe(
    true,
  );
});

test('priority success advances to integrations and selected integration advances to Goals', async () => {
  const screen = view();
  fireEvent.press(screen.getByLabelText('Continue'));
  fireEvent.press(screen.getByLabelText('Continue'));
  const health = screen.getByRole('checkbox');
  expect(health.props.accessibilityState.checked).toBe(false);
  fireEvent.press(health);
  expect(screen.getByRole('checkbox').props.accessibilityState.checked).toBe(true);
  fireEvent.press(screen.getByLabelText('Continue'));
  await screen.findByRole('header', { name: 'Connect your life' });
  expect(mockSave.mutateAsync).toHaveBeenCalledTimes(1);
  expect(screen.getByRole('button', { name: 'Skip for now' })).toBeTruthy();
  fireEvent.press(screen.getByRole('checkbox'));
  fireEvent.press(screen.getByRole('button', { name: 'Continue' }));
  await screen.findByRole('header', { name: 'Your goals' });
  expect(mockSave.mutateAsync).toHaveBeenLastCalledWith({
    integration_preferences: { calendar: 'interested' },
  });
});

test('integration Skip persists deferred intent before Goals', async () => {
  const screen = view();
  fireEvent.press(screen.getByLabelText('Continue'));
  fireEvent.press(screen.getByLabelText('Continue'));
  fireEvent.press(screen.getByRole('checkbox'));
  fireEvent.press(screen.getByLabelText('Continue'));
  await screen.findByRole('header', { name: 'Connect your life' });
  fireEvent.press(screen.getByRole('button', { name: 'Skip for now' }));
  await screen.findByRole('header', { name: 'Your goals' });
  expect(mockSave.mutateAsync).toHaveBeenLastCalledWith({
    integration_preferences: { calendar: 'deferred' },
  });
});

test('goals, notification preferences, and intelligence preserve optional behavior', async () => {
  Object.assign(mockData, {
    status: 'in_progress',
    version: 3,
    recommended_next_action: 'confirm_unit_system',
  });
  const screen = view();
  expect(screen.getByRole('header', { name: 'Your goals' })).toBeTruthy();
  fireEvent.press(screen.getByRole('button', { name: 'Metric' }));
  fireEvent.press(screen.getByRole('button', { name: 'USD' }));
  mockSave.mutateAsync.mockImplementationOnce(async () => {
    mockData.recommended_next_action = 'complete_onboarding';
    mockData.requirements.ready_to_complete = true;
    mockData.version = 4;
    return mockData;
  });
  fireEvent.press(screen.getByRole('button', { name: 'Continue' }));
  await screen.findByRole('header', { name: 'Smart notifications that work for you' });
  expect(mockSave.mutateAsync).toHaveBeenCalledTimes(1);
  fireEvent.press(screen.getByRole('button', { name: 'Skip for now' }));
  await screen.findByRole('header', { name: 'Meet POS Intelligence' });
  expect(mockSave.mutateAsync).toHaveBeenLastCalledWith({
    notification_preferences: { water: 'deferred' },
  });
  expect(screen.queryByText(/estimated|recommendation|analyzed you/i)).toBeNull();
});

test('selected notification persists and advances to Intelligence', async () => {
  Object.assign(mockData, {
    status: 'in_progress',
    version: 3,
    recommended_next_action: 'confirm_currency',
  });
  const screen = view();
  fireEvent.press(screen.getByRole('button', { name: 'Metric' }));
  fireEvent.press(screen.getByRole('button', { name: 'USD' }));
  fireEvent.press(screen.getByRole('button', { name: 'Continue' }));
  await screen.findByRole('header', { name: 'Smart notifications that work for you' });
  fireEvent.press(screen.getByRole('checkbox'));
  fireEvent.press(screen.getByRole('button', { name: 'Continue' }));
  await screen.findByRole('header', { name: 'Meet POS Intelligence' });
  expect(mockSave.mutateAsync).toHaveBeenLastCalledWith({
    notification_preferences: { water: 'enabled' },
  });
});

test('Ready is authoritative and completion occurs only after explicit Enter POS', () => {
  Object.assign(mockData, {
    status: 'in_progress',
    version: 4,
    recommended_next_action: 'complete_onboarding',
  });
  Object.assign(mockData.requirements, { ready_to_complete: true });
  const screen = view();
  expect(screen.getByRole('header', { name: 'You’re Ready' })).toBeTruthy();
  expect(mockComplete.mutateAsync).not.toHaveBeenCalled();
  fireEvent.press(screen.getByRole('button', { name: 'Enter POS' }));
  expect(mockComplete.mutateAsync).toHaveBeenCalledTimes(1);
});
