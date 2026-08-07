const apiUrl = process.env.EXPO_PUBLIC_API_URL?.trim();

if (!apiUrl && __DEV__) {
  throw new Error(
    'EXPO_PUBLIC_API_URL is required for local development. Copy .env.example to an ignored .env file.',
  );
}

export const appConfig = {
  apiUrl: apiUrl ?? 'http://127.0.0.1:8000',
} as const;
