import { act, fireEvent, render, screen } from '@testing-library/react-native';
import { useSyncExternalStore } from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { ApiError } from '@/api';
import { ThemeProvider } from '@/design-system/theme';
import { itemFixture } from '@/features/today/testFixtures';
import type { PlanItem } from '@/features/today/types';
import { createVoiceSessionController } from '../session/controller';
import { isActive } from '../session/reducer';
import { fakeNative } from '../testSupport';
import { VoiceSheet, type VoiceSheetActions } from './VoiceSheet';

jest.mock('@/features/today/NativePicker', () => ({ NativePicker: () => null }));

const NY_NOW = new Date('2026-11-18T19:00:00.000Z');

function setup(options: { consentSeen?: boolean; create?: jest.Mock; now?: Date } = {}) {
  const { native, emit } = fakeNative();
  const create =
    options.create ??
    jest.fn(async (_c: string, body: { title: string }, _k: string): Promise<PlanItem> =>
      itemFixture({ title: body.title, scheduled_for_date: '2026-11-19' }),
    );
  const controller = createVoiceSessionController({
    native,
    planning: {
      account: 'a',
      service: { create },
      credential: () => 't',
      current: () => true,
      recover: jest.fn().mockResolvedValue(undefined),
    },
    timezone: () => 'America/New_York',
    connectivity: () => 'online',
    consentSeen: () => options.consentSeen ?? true,
    markConsentSeen: jest.fn(),
    onCreated: jest.fn(),
    now: options.now ? () => options.now! : undefined,
  });
  const actions: VoiceSheetActions = {
    openSettings: jest.fn(),
    typeInstead: jest.fn(),
    viewToday: jest.fn(),
  };
  function Harness() {
    const state = useSyncExternalStore(controller.subscribe, controller.getState);
    return (
      <SafeAreaProvider
        initialMetrics={{
          frame: { x: 0, y: 0, width: 390, height: 844 },
          insets: { top: 47, right: 0, bottom: 34, left: 0 },
        }}
      >
        <ThemeProvider preference="light">
          <VoiceSheet
            visible={isActive(state.phase) || state.phase === 'failed'}
            state={state}
            controller={controller}
            actions={actions}
          />
        </ThemeProvider>
      </SafeAreaProvider>
    );
  }
  render(<Harness />);
  return { controller, native, emit, create, actions };
}

async function flush() {
  await act(async () => {
    await jest.advanceTimersByTimeAsync(0);
  });
}

async function speak(t: ReturnType<typeof setup>, text: string) {
  act(() => {
    t.controller.open('today', '2026-11-18');
  });
  await flush();
  act(() => {
    t.emit.listening();
    t.emit.partial(text);
    t.emit.final(text);
    t.emit.end('silence');
  });
  await flush();
}

beforeEach(() => {
  jest.useFakeTimers({ now: NY_NOW });
});
afterEach(() => {
  jest.useRealTimers();
});

describe('consent and permission', () => {
  it('shows the explainer first with the exact copy and no OS prompt yet', async () => {
    const t = setup({ consentSeen: false });
    act(() => {
      t.controller.open('today', '2026-11-18');
    });
    expect(screen.getByText('Add a task by voice')).toBeTruthy();
    expect(
      screen.getByText(
        'Speak one task. It’s turned into text on your iPhone. Audio and words never leave your device.',
      ),
    ).toBeTruthy();
    expect(t.native.requestPermissions).not.toHaveBeenCalled();
    fireEvent.press(screen.getByLabelText('Continue'));
    await flush();
    expect(t.native.requestPermissions).toHaveBeenCalledTimes(1);
    expect(t.native.start).toHaveBeenCalledTimes(1);
  });

  it('Not now closes without asking for anything', async () => {
    const t = setup({ consentSeen: false });
    act(() => {
      t.controller.open('today', '2026-11-18');
    });
    fireEvent.press(screen.getByLabelText('Not now'));
    await flush();
    expect(t.native.requestPermissions).not.toHaveBeenCalled();
    expect(screen.queryByText('Add a task by voice')).toBeNull();
  });

  it('denied permission offers Open Settings and Type it instead', async () => {
    const t = setup();
    t.native.requestPermissions.mockResolvedValue({ microphone: 'denied', speech: 'granted' });
    act(() => {
      t.controller.open('today', '2026-11-18');
    });
    await flush();
    expect(screen.getByText(/needs microphone and speech access/)).toBeTruthy();
    fireEvent.press(screen.getByLabelText('Open Settings'));
    expect(t.actions.openSettings).toHaveBeenCalledTimes(1);
    fireEvent.press(screen.getByLabelText('Type it instead'));
    expect(t.actions.typeInstead).toHaveBeenCalledTimes(1);
    expect(t.native.start).not.toHaveBeenCalled();
  });
});

describe('listening', () => {
  it('shows live words, a countdown and Stop and Cancel', async () => {
    const t = setup();
    act(() => {
      t.controller.open('today', '2026-11-18');
    });
    await flush();
    act(() => {
      t.emit.listening();
      t.emit.partial('Workout tomorrow');
    });
    expect(screen.getByText('Workout tomorrow')).toBeTruthy();
    expect(screen.getByLabelText('30 seconds left')).toBeTruthy();
    await act(async () => {
      await jest.advanceTimersByTimeAsync(10_250);
    });
    expect(screen.getByLabelText('20 seconds left')).toBeTruthy();
    fireEvent.press(screen.getByLabelText('Stop'));
    expect(t.native.stop).toHaveBeenCalledTimes(1);
  });

  it('Cancel discards and writes nothing', async () => {
    const t = setup();
    act(() => {
      t.controller.open('today', '2026-11-18');
    });
    await flush();
    act(() => t.emit.listening());
    fireEvent.press(screen.getByLabelText('Cancel'));
    await flush();
    expect(t.native.cancel).toHaveBeenCalled();
    expect(t.create).not.toHaveBeenCalled();
    expect(screen.queryByLabelText('Stop')).toBeNull();
  });

  it.each(['interrupted', 'backgrounded', 'error'])(
    '%s shows Try again and Type it instead',
    async (reason) => {
      const t = setup();
      act(() => {
        t.controller.open('today', '2026-11-18');
      });
      await flush();
      act(() => {
        t.emit.listening();
        t.emit.end(reason);
      });
      await flush();
      expect(screen.getByText('Voice stopped. Try again.')).toBeTruthy();
      expect(screen.getByLabelText('Try again')).toBeTruthy();
      expect(screen.getByLabelText('Type it instead')).toBeTruthy();
      expect(t.create).not.toHaveBeenCalled();
    },
  );
});

describe('rejections', () => {
  it.each([
    ['Mark gym as done', 'Voice can add new tasks only. Edit or complete tasks on the list.'],
    ['Gym at 7 and dentist at 3', 'One task at a time for now.'],
    ['Yesterday call Sam', 'Voice can’t add items to past days yet.'],
    [' ', 'Didn’t catch that.'],
  ])('%j -> %s with Try again and Type it instead', async (text, message) => {
    const t = setup();
    await speak(t, text);
    expect(screen.getByText(message)).toBeTruthy();
    fireEvent.press(screen.getByLabelText('Type it instead'));
    expect(t.actions.typeInstead).toHaveBeenCalledTimes(1);
    fireEvent.press(screen.getByLabelText('Try again'));
    await flush();
    expect(t.native.start).toHaveBeenCalledTimes(2);
  });
});

describe('review card', () => {
  it('shows what was heard with the parsed values, all editable', async () => {
    const t = setup();
    await speak(t, 'Urgent: workout tomorrow at 7 am');
    expect(screen.getByDisplayValue('Workout')).toBeTruthy();
    expect(screen.getByLabelText('Date, Tomorrow')).toBeTruthy();
    expect(screen.getByLabelText(/^Start time, 7:00/)).toBeTruthy();
    expect(
      screen.getByRole('checkbox', { name: 'Mark as a priority' }).props.accessibilityState.checked,
    ).toBe(true);
    expect(screen.getByLabelText('Heard: Urgent: workout tomorrow at 7 am')).toBeTruthy();
    expect(screen.getByLabelText('Add').props.accessibilityState.disabled).toBe(false);
    fireEvent.changeText(screen.getByLabelText('Title'), 'Leg day');
    expect(t.controller.getState().draft?.title).toBe('Leg day');
    fireEvent.press(screen.getByRole('checkbox', { name: 'Mark as a priority' }));
    expect(t.controller.getState().draft?.priority).toBe(false);
  });

  it('shows a short line for each hint', async () => {
    const t = setup();
    await speak(t, 'Water plants daily');
    expect(screen.getByText('Repeating tasks aren’t supported yet — this adds one.')).toBeTruthy();
    expect(t.controller.getState().phase).toBe('review');
  });

  it('end before start is an inline error and nothing is sent', async () => {
    const t = setup();
    await speak(t, 'Deep work 9 to 11 am tomorrow');
    act(() => {
      t.controller.edit({ end: '2026-11-19T08:00:00-05:00' });
    });
    fireEvent.press(screen.getByLabelText('Add'));
    expect(screen.getByText('Choose an end time later than the start.')).toBeTruthy();
    expect(t.create).not.toHaveBeenCalled();
  });

  it('Cancel on the card writes nothing', async () => {
    const t = setup();
    await speak(t, 'Call mom tomorrow');
    fireEvent.press(screen.getByLabelText('Cancel'));
    await flush();
    expect(t.create).not.toHaveBeenCalled();
    expect(screen.queryByLabelText('Add')).toBeNull();
  });
});

describe('clarifications block Add until resolved', () => {
  const add = () => screen.getByLabelText('Add').props.accessibilityState.disabled as boolean;

  it('meridiem: two chips', async () => {
    await speak(setup(), 'Meeting at 3');
    expect(screen.getByText('Which time do you mean?')).toBeTruthy();
    expect(add()).toBe(true);
    fireEvent.press(screen.getByLabelText('3 PM'));
    expect(add()).toBe(false);
    expect(screen.queryByText('Which time do you mean?')).toBeNull();
  });

  it('next weekday: two date chips', async () => {
    await speak(setup(), 'Next Friday dinner with Priya');
    expect(add()).toBe(true);
    expect(screen.getByLabelText('Fri, Nov 20')).toBeTruthy();
    fireEvent.press(screen.getByLabelText('Fri, Nov 27'));
    expect(add()).toBe(false);
  });

  it('midnight: Pick a time', async () => {
    const t = setup();
    await speak(t, 'Submit at midnight');
    expect(add()).toBe(true);
    fireEvent.press(screen.getByLabelText('Pick a time'));
    expect(t.controller.getState().draft?.scheduled).toBe(true);
    expect(add()).toBe(true);
    act(() => {
      t.controller.edit({ start: '2026-11-18T23:59:00-05:00' });
    });
    expect(add()).toBe(false);
  });

  it('time passed: Keep today and Move to tomorrow', async () => {
    const t = setup();
    await speak(t, 'Gym at 7 am');
    expect(add()).toBe(true);
    fireEvent.press(screen.getByLabelText('Move to tomorrow'));
    expect(add()).toBe(false);
    expect(t.controller.getState().draft?.date).toBe('2026-11-19');
  });

  it('date invalid: Pick a date', async () => {
    const t = setup();
    await speak(t, 'Pay rent february 30');
    expect(add()).toBe(true);
    fireEvent.press(screen.getByLabelText('Pick a date'));
    act(() => {
      t.controller.markDatePicked();
    });
    expect(add()).toBe(false);
  });

  it('title missing: asks for a title and unblocks once typed', async () => {
    await speak(setup(), 'Tomorrow at 5 pm');
    expect(screen.getByText('What’s the task? Add a title.')).toBeTruthy();
    expect(add()).toBe(true);
    fireEvent.changeText(screen.getByLabelText('Title'), 'Call mom');
    expect(add()).toBe(false);
  });

  it('fold: two offset chips', async () => {
    const t = setup({ now: new Date('2027-11-06T17:00:00.000Z') });
    act(() => {
      t.controller.open('today', '2027-11-07');
    });
    await flush();
    act(() => {
      t.emit.listening();
      t.emit.final('Call at 1:30 am');
      t.emit.end('silence');
    });
    await flush();
    expect(
      screen.getByText('This time happens twice that day. Which one do you mean?'),
    ).toBeTruthy();
    fireEvent.press(screen.getByLabelText('Later · UTC-05:00'));
    expect(add()).toBe(false);
  });
});

describe('saving', () => {
  it('Add tapped five times sends one request and locks the card', async () => {
    let finish: (item: PlanItem) => void = () => undefined;
    const create = jest.fn(() => new Promise<PlanItem>((resolve) => (finish = resolve)));
    const t = setup({ create });
    await speak(t, 'Call mom tomorrow');
    const add = screen.getByLabelText('Add');
    for (let i = 0; i < 5; i += 1) fireEvent.press(add);
    await flush();
    expect(create).toHaveBeenCalledTimes(1);
    expect(screen.getByLabelText('Adding…').props.accessibilityState).toMatchObject({
      busy: true,
      disabled: true,
    });
    expect(screen.queryByLabelText('Cancel')).toBeNull();
    expect(screen.getByLabelText('Title').props.editable).toBe(false);
    await act(async () => {
      finish(itemFixture({ title: 'Call mom', scheduled_for_date: '2026-11-19' }));
      await jest.advanceTimersByTimeAsync(0);
    });
    expect(t.controller.getState().phase).toBe('done');
  });

  it('shows an honest unknown outcome with View Today and Try again', async () => {
    const create = jest.fn().mockRejectedValue(new ApiError('timeout', 'timeout'));
    const t = setup({ create });
    await speak(t, 'Call mom tomorrow');
    fireEvent.press(screen.getByLabelText('Add'));
    await act(async () => {
      await jest.advanceTimersByTimeAsync(14_000);
    });
    expect(screen.getByText('Couldn’t confirm. Check Today before adding it again.')).toBeTruthy();
    expect(screen.queryByText(/saved/i)).toBeNull();
    fireEvent.press(screen.getByLabelText('View Today'));
    expect(t.actions.viewToday).toHaveBeenCalledTimes(1);
    expect(screen.queryByLabelText('Cancel')).toBeNull();
    create.mockResolvedValue(itemFixture({ title: 'Call mom', scheduled_for_date: '2026-11-19' }));
    fireEvent.press(screen.getByLabelText('Try again'));
    await flush();
    expect(create.mock.calls.at(-1)?.[2]).toBe(create.mock.calls[0]?.[2]);
  });
});

describe('accessibility', () => {
  it('every button and field has an accessible name', async () => {
    const t = setup();
    await speak(t, 'Meeting at 3');
    const buttons = screen.getAllByRole('button');
    expect(buttons.length).toBeGreaterThan(3);
    for (const button of buttons) {
      expect(String(button.props.accessibilityLabel ?? '').length).toBeGreaterThan(0);
    }
    expect(screen.getByLabelText('Title')).toBeTruthy();
    expect(screen.getByRole('checkbox', { name: 'Mark as a priority' })).toBeTruthy();
    // The primary action is the only filled button; Add is disabled while a choice is pending.
    expect(screen.getByLabelText('Add').props.accessibilityState.disabled).toBe(true);
  });

  it('the listening countdown and live words are announced with labels', async () => {
    const t = setup();
    act(() => {
      t.controller.open('today', '2026-11-18');
    });
    await flush();
    act(() => {
      t.emit.listening();
      t.emit.partial('Call mom');
    });
    expect(screen.getByLabelText('Heard so far: Call mom')).toBeTruthy();
    expect(screen.getByLabelText('30 seconds left').props.accessibilityRole).toBe('timer');
  });
});
