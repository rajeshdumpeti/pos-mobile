const originalApiUrl = process.env.EXPO_PUBLIC_API_BASE_URL;

function loadAppConfig() {
  let config: typeof import('./env').appConfig | undefined;

  jest.isolateModules(() => {
    config = jest.requireActual<typeof import('./env')>('./env').appConfig;
  });

  if (!config) {
    throw new Error('Unable to load application configuration');
  }

  return config;
}

afterEach(() => {
  if (originalApiUrl === undefined) {
    delete process.env.EXPO_PUBLIC_API_BASE_URL;
  } else {
    process.env.EXPO_PUBLIC_API_BASE_URL = originalApiUrl;
  }
  jest.resetModules();
});

it('reads and trims the public API URL', () => {
  process.env.EXPO_PUBLIC_API_BASE_URL = '  http://localhost:8000  ';

  expect(loadAppConfig().apiUrl).toBe('http://localhost:8000');
});

it('fails clearly in development when the public API URL is missing', () => {
  delete process.env.EXPO_PUBLIC_API_BASE_URL;

  expect(() => loadAppConfig()).toThrow('The API base URL is required.');
});
