import { useState } from 'react';
import { fireEvent, render } from '@testing-library/react-native';
import { UIManager } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { ThemeProvider } from '@/design-system/theme';
import { NativePicker } from './NativePicker';
import { ScheduleFields } from './ScheduleFields';
import type { PlanDraft } from './draft';
import { supportsNativePicker } from './nativeVisuals';
jest.mock('./SupportedNativePicker', () => ({
  __esModule: true,
  default: () => {
    throw new Error('Unavailable native picker must never render');
  },
}));
const confirm = jest.fn(),
  wall = jest.fn(),
  close = jest.fn();
function Wrapper({ children }: React.PropsWithChildren) {
  return (
    <SafeAreaProvider
      initialMetrics={{
        frame: { x: 0, y: 0, width: 390, height: 844 },
        insets: { top: 47, right: 0, bottom: 34, left: 0 },
      }}
    >
      <ThemeProvider preference="light">{children}</ThemeProvider>
    </SafeAreaProvider>
  );
}
beforeEach(() => {
  jest.clearAllMocks();
  jest.spyOn(UIManager, 'hasViewManagerConfig').mockReturnValue(false);
});
afterEach(() => jest.restoreAllMocks());
test('missing native calendar supports month navigation and leap day without rendering the absent view', () => {
  expect(supportsNativePicker('date')).toBe(false);
  const view = render(
    <Wrapper>
      <NativePicker
        mode="date"
        value={new Date('2028-01-31T17:00:00Z')}
        zone="America/New_York"
        label="Choose date"
        onConfirm={confirm}
        onConfirmWall={wall}
        onClose={close}
      />
    </Wrapper>,
  );
  fireEvent.press(view.getByRole('button', { name: 'Next month' }));
  fireEvent.press(view.getByRole('button', { name: /February 29, 2028/ }));
  fireEvent.press(view.getByRole('button', { name: 'Done' }));
  expect(wall).toHaveBeenCalledWith({ date: '2028-02-29', clock: '12:00' });
  expect(confirm).not.toHaveBeenCalled();
});
test('compatible time chooser confirms hour, exact minute and period only on Done', () => {
  const view = render(
    <Wrapper>
      <NativePicker
        mode="time"
        value={new Date('2026-10-02T16:00:00Z')}
        zone="America/New_York"
        label="Choose time"
        onConfirm={confirm}
        onConfirmWall={wall}
        onClose={close}
      />
    </Wrapper>,
  );
  fireEvent.changeText(view.getByLabelText('Hour'), '6');
  fireEvent.changeText(view.getByLabelText('Minute'), '07');
  expect(wall).not.toHaveBeenCalled();
  fireEvent.press(view.getByRole('button', { name: 'Done' }));
  expect(wall).toHaveBeenCalledWith({ date: '2026-10-02', clock: '18:07' });
});
test('Cancel discards picker changes', () => {
  const view = render(
    <Wrapper>
      <NativePicker
        mode="time"
        value={new Date('2026-10-02T16:00:00Z')}
        zone="America/New_York"
        label="Choose time"
        onConfirm={confirm}
        onConfirmWall={wall}
        onClose={close}
      />
    </Wrapper>,
  );
  fireEvent.changeText(view.getByLabelText('Hour'), '6');
  fireEvent.press(view.getByRole('button', { name: 'Cancel' }));
  expect(wall).not.toHaveBeenCalled();
  expect(confirm).not.toHaveBeenCalled();
});
function Schedule({ date }: { date: string }) {
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
    <ScheduleFields
      draft={draft}
      disabled={false}
      errors={{}}
      onChange={(patch) => setDraft((value) => ({ ...value, ...patch }))}
    />
  );
}
test.each([
  ['2026-11-01', 'Hour 1', 'This time occurs twice. Choose which one you mean.'],
  ['2026-03-08', 'Hour 2', 'That time does not exist on this date. Choose another time.'],
])('compatible picker retains DST validation on %s', (date, hour, message) => {
  const view = render(
    <Wrapper>
      <Schedule date={date} />
    </Wrapper>,
  );
  fireEvent.press(view.getByRole('button', { name: 'Start time, No time selected' }));
  fireEvent.changeText(view.getByLabelText('Hour'), hour.replace('Hour ', ''));
  fireEvent.changeText(view.getByLabelText('Minute'), '30');
  fireEvent.press(view.getByRole('button', { name: 'AM' }));
  fireEvent.press(view.getByRole('button', { name: 'Done' }));
  expect(view.getByText(message)).toBeTruthy();
});

test('invalid or empty numeric entry prevents confirming the previous valid time', () => {
  const view = render(
    <Wrapper>
      <NativePicker
        mode="time"
        value={new Date('2026-10-02T16:00:00Z')}
        zone="America/New_York"
        label="Choose time"
        onConfirm={confirm}
        onConfirmWall={wall}
        onClose={close}
      />
    </Wrapper>,
  );
  fireEvent.changeText(view.getByLabelText('Hour'), '');
  fireEvent.press(view.getByRole('button', { name: 'Done' }));
  expect(wall).not.toHaveBeenCalled();
  fireEvent.changeText(view.getByLabelText('Hour'), '6');
  fireEvent.changeText(view.getByLabelText('Minute'), '70');
  fireEvent.press(view.getByRole('button', { name: 'Done' }));
  expect(wall).not.toHaveBeenCalled();
  fireEvent.press(view.getByRole('button', { name: 'Set minutes to 15' }));
  fireEvent.press(view.getByRole('button', { name: 'Done' }));
  expect(wall).toHaveBeenCalledWith({ date: '2026-10-02', clock: '18:15' });
});
