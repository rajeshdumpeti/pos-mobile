import { NativeModule, requireNativeModule } from 'expo';

import type {
  PosVoiceNativeEvents,
  VoiceAvailability,
  VoiceModelInstallResult,
  VoicePermissions,
  VoiceStartOptions,
} from './PosVoice.types';

declare class PosVoiceModule extends NativeModule<PosVoiceNativeEvents> {
  getAvailability(): Promise<VoiceAvailability>;
  requestPermissions(): Promise<VoicePermissions>;
  installModel(): Promise<VoiceModelInstallResult>;
  start(options: VoiceStartOptions): Promise<void>;
  stop(): Promise<void>;
  cancel(): Promise<void>;
}

export type PosVoiceNative = PosVoiceModule;

/** Returns null when the native module is not part of the installed dev client. */
export function loadNativeModule(): PosVoiceNative | null {
  try {
    return requireNativeModule<PosVoiceModule>('PosVoice');
  } catch {
    return null;
  }
}
