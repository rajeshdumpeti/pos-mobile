import AsyncStorage from '@react-native-async-storage/async-storage';

import type { ThemePreference } from './appearancePreference';

const appearancePreferenceKey = '@pos/appearance-preference';

export type AppearancePreferenceStorage = {
  read: () => Promise<string | null>;
  write: (preference: ThemePreference) => Promise<void>;
};

export const appearancePreferenceStorage: AppearancePreferenceStorage = {
  read: () => AsyncStorage.getItem(appearancePreferenceKey),
  write: (preference) => AsyncStorage.setItem(appearancePreferenceKey, preference),
};
