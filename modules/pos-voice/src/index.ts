import { Platform } from 'react-native';

import { loadNativeModule, type PosVoiceNative } from './PosVoiceModule';
import type {
  PosVoiceNativeEvents,
  VoiceAvailability,
  VoiceEndEvent,
  VoiceFinalEvent,
  VoiceModelInstallResult,
  VoicePartialEvent,
  VoicePermissions,
  VoiceStartOptions,
  VoiceStateChangeEvent,
  VoiceSubscription,
} from './PosVoice.types';

export * from './PosVoice.types';

const noopSubscription: VoiceSubscription = { remove: () => undefined };

function native(): PosVoiceNative | null {
  if (Platform.OS !== 'ios') return null;
  return loadNativeModule();
}

class PosVoiceError extends Error {
  readonly code: string;
  constructor(code: string) {
    super(code);
    this.name = 'PosVoiceError';
    this.code = code;
  }
}

export async function getAvailability(): Promise<VoiceAvailability> {
  const module = native();
  if (Platform.OS !== 'ios') return { status: 'unsupported_platform' };
  if (!module) return { status: 'unsupported_platform', detail: 'native_module_missing' };
  return module.getAvailability();
}

export async function requestPermissions(): Promise<VoicePermissions> {
  const module = native();
  if (!module) return { microphone: 'undetermined', speech: 'undetermined' };
  return module.requestPermissions();
}

/** Investigation only (VOICE-M1 debug screen). Never call from product UI. */
export async function installModel(): Promise<VoiceModelInstallResult> {
  const module = native();
  if (!module) return 'unsupported';
  return module.installModel();
}

/** Rejects with a `code`; there is no degraded or server mode. */
export async function start(options: VoiceStartOptions): Promise<void> {
  const module = native();
  if (!module) throw new PosVoiceError('unsupported_platform');
  return module.start(options);
}

export async function stop(): Promise<void> {
  await native()?.stop();
}

export async function cancel(): Promise<void> {
  await native()?.cancel();
}

function listen<K extends keyof PosVoiceNativeEvents>(
  name: K,
  listener: PosVoiceNativeEvents[K],
): VoiceSubscription {
  const module = native();
  if (!module) return noopSubscription;
  return module.addListener(name, listener);
}

export const onStateChange = (l: (e: VoiceStateChangeEvent) => void) => listen('onStateChange', l);
export const onPartial = (l: (e: VoicePartialEvent) => void) => listen('onPartial', l);
export const onFinal = (l: (e: VoiceFinalEvent) => void) => listen('onFinal', l);
export const onEnd = (l: (e: VoiceEndEvent) => void) => listen('onEnd', l);
