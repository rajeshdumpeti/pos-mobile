import { loadApiConfig } from '@/api/client/apiConfig';

const apiConfig = loadApiConfig();

export const appConfig = {
  apiUrl: apiConfig.baseUrl,
} as const;

/**
 * Build-time switch for Voice v1. Only the exact string "true" enables it; anything else,
 * including a missing variable, keeps voice off. Read at call time so tests can change it.
 */
export function isVoiceBuildEnabled(): boolean {
  return process.env.EXPO_PUBLIC_VOICE_ENABLED === 'true';
}
