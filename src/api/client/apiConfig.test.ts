import { ApiConfigurationError, createApiConfig } from './apiConfig';
test.each([
  ['http://127.0.0.1:8000/', 'development', 'http://127.0.0.1:8000'],
  ['http://10.0.2.2:8000', 'development', 'http://10.0.2.2:8000'],
  ['https://api.example.test/', 'staging', 'https://api.example.test'],
])('validates and normalizes %s', (value, env, expected) =>
  expect(createApiConfig(value, env as 'development' | 'staging')).toEqual({ baseUrl: expected }),
);
test.each([
  [undefined, 'development'],
  ['bad', 'development'],
  ['http://api.example.test', 'production'],
  ['https://user:pass@example.test', 'production'],
])('rejects unsafe configuration', (value, env) =>
  expect(() => createApiConfig(value, env as 'development' | 'production')).toThrow(
    ApiConfigurationError,
  ),
);
