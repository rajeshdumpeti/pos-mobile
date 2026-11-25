// Test-only helpers. Synthetic data; never imported by product code.
import type { VoiceNative } from './availability';

type Handlers = {
  state: Array<(e: { state: string }) => void>;
  partial: Array<(e: { text: string }) => void>;
  final: Array<(e: { text: string }) => void>;
  end: Array<(e: { reason: string; code?: string }) => void>;
};

export function fakeNative(permissions = { microphone: 'granted', speech: 'granted' }) {
  const handlers: Handlers = { state: [], partial: [], final: [], end: [] };
  const sub =
    <T>(list: Array<(e: T) => void>) =>
    (cb: (e: T) => void) => {
      list.push(cb);
      return { remove: () => void list.splice(list.indexOf(cb), 1) };
    };
  const native = {
    getAvailability: jest.fn().mockResolvedValue({ status: 'available' }),
    requestPermissions: jest.fn().mockResolvedValue(permissions),
    start: jest.fn().mockResolvedValue(undefined),
    stop: jest.fn().mockResolvedValue(undefined),
    cancel: jest.fn().mockResolvedValue(undefined),
    onStateChange: sub(handlers.state),
    onPartial: sub(handlers.partial),
    onFinal: sub(handlers.final),
    onEnd: sub(handlers.end),
  };
  const emit = {
    listening: () => handlers.state.forEach((cb) => cb({ state: 'listening' })),
    partial: (text: string) => handlers.partial.forEach((cb) => cb({ text })),
    final: (text: string) => handlers.final.forEach((cb) => cb({ text })),
    end: (reason: string) => handlers.end.forEach((cb) => cb({ reason })),
  };
  return { native: native as unknown as VoiceNative & typeof native, emit, handlers };
}
