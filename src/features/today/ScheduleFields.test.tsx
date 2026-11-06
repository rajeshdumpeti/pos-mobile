import { useState } from 'react';
import { fireEvent, render, waitFor } from '@testing-library/react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { ThemeProvider } from '@/design-system/theme';
import { ScheduleFields } from './ScheduleFields';
import type { PlanDraft } from './draft';
jest.mock('@react-native-community/datetimepicker', () => {
  const ReactModule = jest.requireActual<typeof import('react')>('react');
  const { View: MockView } = jest.requireActual<typeof import('react-native')>('react-native');
  return {
    __esModule: true,
    default: (props: object) =>
      ReactModule.createElement(MockView, { ...props, testID: 'native-picker' }),
  };
});
jest.mock('./nativeVisuals', () => ({ supportsNativePicker: () => true }));
const mockChange = jest.fn();
function Form({ date = '2026-11-01' }: { date?: string }) {
  const [draft, setDraft] = useState<PlanDraft>({
    title: 'Test',
    date,
    timezone: 'America/New_York',
    scheduled: true,
    start: '',
    end: '',
    priority: false,
  });
  return (
    <SafeAreaProvider
      initialMetrics={{
        frame: { x: 0, y: 0, width: 390, height: 844 },
        insets: { top: 47, right: 0, bottom: 34, left: 0 },
      }}
    >
      <ThemeProvider preference="light">
        <ScheduleFields
          draft={draft}
          disabled={false}
          errors={{}}
          onChange={(patch) => {
            mockChange(patch);
            setDraft((old) => ({ ...old, ...patch }));
          }}
        />
      </ThemeProvider>
    </SafeAreaProvider>
  );
}
beforeEach(() => jest.clearAllMocks());
test('native time selection requires explicit review of a DST fold', async () => {
  const view = render(<Form />);
  fireEvent.press(view.getByRole('button', { name: 'Start time, No time selected' }));
  const picker = await waitFor(() => view.getByTestId('native-picker'));
  expect(picker.props.timeZoneName).toBe('America/New_York');
  fireEvent(picker, 'change', { type: 'set' }, new Date('2026-11-01T05:30:00Z'));
  fireEvent.press(view.getByRole('button', { name: 'Done' }));
  expect(view.getByText('This time occurs twice. Choose which one you mean.')).toBeTruthy();
  expect(mockChange).toHaveBeenLastCalledWith({ start: '' });
  fireEvent.press(view.getByRole('button', { name: 'Later 1:30 AM · EST' }));
  expect(mockChange).toHaveBeenLastCalledWith({ start: '2026-11-01T01:30:00-05:00' });
});
test('native calendar updates the assigned day without guessing scheduled times', async () => {
  const view = render(<Form date="2026-10-02" />);
  fireEvent.press(view.getByRole('button', { name: /Date,/ }));
  await waitFor(() => view.getByTestId('native-picker'));
  fireEvent(
    view.getByTestId('native-picker'),
    'change',
    { type: 'set' },
    new Date('2026-10-03T16:00:00Z'),
  );
  fireEvent.press(view.getByRole('button', { name: 'Done' }));
  expect(mockChange).toHaveBeenLastCalledWith({ date: '2026-10-03', start: '', end: '' });
  expect(view.getByText('Choose times for your new date.')).toBeTruthy();
});
