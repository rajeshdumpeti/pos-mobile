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

describe('EXPO_PUBLIC_VOICE_ENABLED (VOICE-M4)', () => {
  const original = process.env.EXPO_PUBLIC_VOICE_ENABLED;
  const voiceEnabled = () =>
    jest.requireActual<typeof import('./env')>('./env').isVoiceBuildEnabled();
  afterEach(() => {
    if (original === undefined) delete process.env.EXPO_PUBLIC_VOICE_ENABLED;
    else process.env.EXPO_PUBLIC_VOICE_ENABLED = original;
  });

  it('is off by default', () => {
    delete process.env.EXPO_PUBLIC_VOICE_ENABLED;
    expect(voiceEnabled()).toBe(false);
  });

  it.each(['TRUE', 'True', '1', 'yes', 'on', ' true', 'true ', '', 'false'])(
    'treats %j as off',
    (value) => {
      process.env.EXPO_PUBLIC_VOICE_ENABLED = value;
      expect(voiceEnabled()).toBe(false);
    },
  );

  it('is on only for the exact string "true"', () => {
    process.env.EXPO_PUBLIC_VOICE_ENABLED = 'true';
    expect(voiceEnabled()).toBe(true);
  });
});
