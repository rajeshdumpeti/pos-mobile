export type VoiceLocale = 'en-US';

export type VoiceAvailabilityStatus =
  | 'available'
  | 'unsupported_platform'
  | 'unsupported_os'
  | 'unsupported_locale'
  | 'model_not_installed'
  | 'permission_denied'
  | 'permission_undetermined'
  | 'restricted';

export type VoiceAvailability = {
  status: VoiceAvailabilityStatus;
  /** Short machine-readable hint (never recognized content). */
  detail?: string;
};

export type MicrophonePermission = 'granted' | 'denied' | 'undetermined';
export type SpeechPermission = 'granted' | 'denied' | 'undetermined' | 'restricted';

export type VoicePermissions = {
  microphone: MicrophonePermission;
  speech: SpeechPermission;
};

export type VoiceStartOptions = {
  locale: VoiceLocale;
  /** Hard cap on one session. Product value: 30000. */
  maxDurationMs: number;
  /** Silence after speech began that ends the session. Product value: 1500. */
  silenceTimeoutMs: number;
  contextualStrings?: string[];
};

export type VoiceState = 'idle' | 'starting' | 'listening' | 'finishing' | 'ended';

export type VoiceEndReason =
  'stopped' | 'cancelled' | 'silence' | 'max_duration' | 'interrupted' | 'backgrounded' | 'error';

export type VoiceModelInstallResult = 'installed' | 'failed' | 'unsupported';

export type VoiceStateChangeEvent = { state: VoiceState };
export type VoicePartialEvent = { text: string };
export type VoiceFinalEvent = { text: string };
export type VoiceEndEvent = { reason: VoiceEndReason; code?: string };

export type VoiceSubscription = { remove(): void };

/** Rejection codes thrown by start(). Availability statuses are reused as codes. */
export type VoiceStartErrorCode =
  | 'already_active'
  | 'invalid_options'
  | Exclude<VoiceAvailabilityStatus, 'available'>
  | (string & {});

export type PosVoiceNativeEvents = {
  onStateChange(event: VoiceStateChangeEvent): void;
  onPartial(event: VoicePartialEvent): void;
  onFinal(event: VoiceFinalEvent): void;
  onEnd(event: VoiceEndEvent): void;
};
