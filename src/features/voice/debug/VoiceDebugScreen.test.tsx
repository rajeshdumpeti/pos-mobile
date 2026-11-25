import { render } from '@testing-library/react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { ThemeProvider } from '@/design-system/theme';

import { VoiceDebugScreen } from './VoiceDebugScreen';

const mockRedirect = jest.fn();
jest.mock('expo-router', () => ({
  Redirect: (props: { href: string }) => {
    mockRedirect(props.href);
    return null;
  },
}));
jest.mock('../native', () => ({
  getAvailability: jest.fn().mockResolvedValue({ status: 'model_not_installed' }),
  requestPermissions: jest.fn(),
  installModel: jest.fn(),
  start: jest.fn(),
  stop: jest.fn(),
  cancel: jest.fn().mockResolvedValue(undefined),
  onStateChange: () => ({ remove: jest.fn() }),
  onPartial: () => ({ remove: jest.fn() }),
  onFinal: () => ({ remove: jest.fn() }),
  onEnd: () => ({ remove: jest.fn() }),
}));

const wrap = (node: React.ReactElement) => (
  <SafeAreaProvider
    initialMetrics={{
      frame: { x: 0, y: 0, width: 320, height: 640 },
      insets: { top: 44, bottom: 34, left: 0, right: 0 },
    }}
  >
    <ThemeProvider preference="light">{node}</ThemeProvider>
  </SafeAreaProvider>
);

const globalWithDev = globalThis as unknown as { __DEV__: boolean };
const original = globalWithDev.__DEV__;
afterEach(() => {
  globalWithDev.__DEV__ = original;
  mockRedirect.mockClear();
});

describe('VoiceDebugScreen', () => {
  it('renders controls in __DEV__', async () => {
    globalWithDev.__DEV__ = true;
    const screen = render(wrap(<VoiceDebugScreen />));
    expect(screen.getByTestId('voice-debug-screen')).toBeTruthy();
    expect(screen.getByLabelText('Start')).toBeTruthy();
    expect(screen.getByLabelText('Install model (investigation)')).toBeTruthy();
    expect(mockRedirect).not.toHaveBeenCalled();
    expect(await screen.findByText(/model_not_installed/)).toBeTruthy();
  });

  it('redirects to Today outside __DEV__', () => {
    globalWithDev.__DEV__ = false;
    const screen = render(wrap(<VoiceDebugScreen />));
    expect(screen.queryByTestId('voice-debug-screen')).toBeNull();
    expect(mockRedirect).toHaveBeenCalledWith('/(app)/(tabs)');
  });
});
