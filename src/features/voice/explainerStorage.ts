import AsyncStorage from '@react-native-async-storage/async-storage';

const explainerSeenKey = '@pos/voice-explainer-seen';

/**
 * Remembers one thing only: that the voice explainer was shown. A boolean with no content,
 * in the same non-sensitive preference style as the appearance setting.
 */
export type VoiceExplainerStorage = {
  read: () => Promise<boolean>;
  write: () => Promise<void>;
};

export const voiceExplainerStorage: VoiceExplainerStorage = {
  read: async () => (await AsyncStorage.getItem(explainerSeenKey)) === 'true',
  write: () => AsyncStorage.setItem(explainerSeenKey, 'true'),
};
