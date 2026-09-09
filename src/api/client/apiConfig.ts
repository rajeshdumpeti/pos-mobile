export type ApiEnvironment = 'development' | 'staging' | 'production';
export class ApiConfigurationError extends Error {
  readonly name = 'ApiConfigurationError';
}
export function createApiConfig(value: string | undefined, environment: ApiEnvironment) {
  if (!value) throw new ApiConfigurationError('The API base URL is required.');
  let url: URL;
  try {
    url = new URL(value);
  } catch {
    throw new ApiConfigurationError('The API base URL is malformed.');
  }
  if (url.username || url.password || url.search || url.hash)
    throw new ApiConfigurationError('The API base URL contains unsupported components.');
  const local =
    url.hostname === 'localhost' ||
    url.hostname === '127.0.0.1' ||
    url.hostname === '10.0.2.2' ||
    /^10\.|^192\.168\.|^172\.(1[6-9]|2\d|3[01])\./.test(url.hostname);
  if (
    url.protocol !== 'https:' &&
    !(environment === 'development' && url.protocol === 'http:' && local)
  )
    throw new ApiConfigurationError('The API base URL must use an approved secure origin.');
  return { baseUrl: url.toString().replace(/\/+$/, '') } as const;
}
export function loadApiConfig(
  environment: ApiEnvironment = __DEV__ ? 'development' : 'production',
) {
  return createApiConfig(process.env.EXPO_PUBLIC_API_URL, environment);
}
