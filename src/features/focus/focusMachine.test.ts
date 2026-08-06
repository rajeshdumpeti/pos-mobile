import { focusReducer, initialFocusState } from './focusMachine';
test('moves through idle, running, paused, resumed and completed', () => {
  const running = focusReducer(initialFocusState, { type: 'start', now: 1_000 });
  expect(running.phase).toBe('running');
  const paused = focusReducer(running, { type: 'pause', now: 11_000 });
  expect(paused).toMatchObject({ phase: 'paused', remainingSeconds: 1490 });
  const resumed = focusReducer(paused, { type: 'resume', now: 20_000 });
  expect(focusReducer(resumed, { type: 'complete' }).phase).toBe('completed');
});
test('reconciles elapsed time from timestamps', () => {
  const running = focusReducer(initialFocusState, { type: 'start', now: 0 });
  expect(focusReducer(running, { type: 'tick', now: 30_000 }).remainingSeconds).toBe(1470);
});
