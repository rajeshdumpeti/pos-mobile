export type FocusPhase = 'idle' | 'running' | 'paused' | 'completed';
export type FocusState = { phase: FocusPhase; durationSeconds: number; remainingSeconds: number; endsAt?: number };
export type FocusAction =
  | { type: 'selectDuration'; seconds: number }
  | { type: 'start'; now: number }
  | { type: 'tick'; now: number }
  | { type: 'pause'; now: number }
  | { type: 'resume'; now: number }
  | { type: 'extend'; seconds: number; now: number }
  | { type: 'complete' }
  | { type: 'cancel' }
  | { type: 'done' };

export const initialFocusState: FocusState = { phase: 'idle', durationSeconds: 25 * 60, remainingSeconds: 25 * 60 };
const remainingAt = (state: FocusState, now: number) => state.phase === 'running' && state.endsAt ? Math.max(0, Math.ceil((state.endsAt - now) / 1000)) : state.remainingSeconds;
export function focusReducer(state: FocusState, action: FocusAction): FocusState {
  switch (action.type) {
    case 'selectDuration': return state.phase === 'idle' ? { ...state, durationSeconds: action.seconds, remainingSeconds: action.seconds } : state;
    case 'start': return state.phase === 'idle' ? { ...state, phase: 'running', endsAt: action.now + state.remainingSeconds * 1000 } : state;
    case 'tick': { const remainingSeconds = remainingAt(state, action.now); return remainingSeconds === 0 ? { ...state, phase: 'completed', remainingSeconds: 0, endsAt: undefined } : { ...state, remainingSeconds }; }
    case 'pause': { const remainingSeconds = remainingAt(state, action.now); return state.phase === 'running' ? { ...state, phase: 'paused', remainingSeconds, endsAt: undefined } : state; }
    case 'resume': return state.phase === 'paused' ? { ...state, phase: 'running', endsAt: action.now + state.remainingSeconds * 1000 } : state;
    case 'extend': { const remainingSeconds = remainingAt(state, action.now) + action.seconds; return state.phase === 'running' ? { ...state, remainingSeconds, endsAt: action.now + remainingSeconds * 1000 } : state.phase === 'paused' ? { ...state, remainingSeconds } : state; }
    case 'complete': return state.phase === 'running' || state.phase === 'paused' ? { ...state, phase: 'completed', endsAt: undefined } : state;
    case 'cancel': return state.phase === 'running' || state.phase === 'paused' ? { ...initialFocusState, durationSeconds: state.durationSeconds, remainingSeconds: state.durationSeconds } : state;
    case 'done': return state.phase === 'completed' ? { ...initialFocusState, durationSeconds: state.durationSeconds, remainingSeconds: state.durationSeconds } : state;
  }
}
export function formatFocusTime(seconds: number) { return `${String(Math.floor(seconds / 60)).padStart(2, '0')}:${String(seconds % 60).padStart(2, '0')}`; }
