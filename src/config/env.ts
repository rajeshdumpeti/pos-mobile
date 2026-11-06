import { loadApiConfig } from '@/api/client/apiConfig';

const apiConfig = loadApiConfig();

export const appConfig = {
  apiUrl: apiConfig.baseUrl,
} as const;
