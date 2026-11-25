import { Platform } from 'react-native';

import * as voice from './index';

const mockNative = {
  getAvailability: jest.fn(),
  requestPermissions: jest.fn(),
  installModel: jest.fn(),
  start: jest.fn(),
  stop: jest.fn(),
  cancel: jest.fn(),
  addListener: jest.fn(),
};
const mockLoad = jest.fn();
jest.mock('./PosVoiceModule', () => ({ loadNativeModule: () => mockLoad() }));

const options = { locale: 'en-US', maxDurationMs: 30000, silenceTimeoutMs: 1500 } as const;

function setup(os: 'ios' | 'android', native: typeof mockNative | null) {
  Platform.OS = os;
  mockLoad.mockReturnValue(native);
}

beforeEach(() => jest.clearAllMocks());
afterAll(() => {
  Platform.OS = 'ios';
});

describe('pos-voice JS wrapper', () => {
  it('delegates to the native module on iOS', async () => {
    mockNative.getAvailability.mockResolvedValue({ status: 'available' });
    mockNative.requestPermissions.mockResolvedValue({ microphone: 'granted', speech: 'granted' });
    mockNative.installModel.mockResolvedValue('installed');
    mockNative.start.mockResolvedValue(undefined);
    setup('ios', mockNative);
    expect(await voice.getAvailability()).toEqual({ status: 'available' });
    expect(await voice.requestPermissions()).toEqual({ microphone: 'granted', speech: 'granted' });
    expect(await voice.installModel()).toBe('installed');
    await voice.start(options);
    expect(mockNative.start).toHaveBeenCalledWith(options);
    await voice.stop();
    await voice.cancel();
    expect(mockNative.stop).toHaveBeenCalledTimes(1);
    expect(mockNative.cancel).toHaveBeenCalledTimes(1);
  });

  it('propagates native rejection codes from start()', async () => {
    mockNative.start.mockRejectedValue(Object.assign(new Error('x'), { code: 'already_active' }));
    setup('ios', mockNative);
    await expect(voice.start(options)).rejects.toMatchObject({ code: 'already_active' });
  });

  it('subscribes to the four events and can unsubscribe', () => {
    const remove = jest.fn();
    mockNative.addListener.mockReturnValue({ remove });
    setup('ios', mockNative);
    const sub = voice.onPartial(() => undefined);
    voice.onStateChange(() => undefined);
    voice.onFinal(() => undefined);
    voice.onEnd(() => undefined);
    expect(mockNative.addListener.mock.calls.map((c) => c[0])).toEqual([
      'onPartial',
      'onStateChange',
      'onFinal',
      'onEnd',
    ]);
    sub.remove();
    expect(remove).toHaveBeenCalled();
  });

  it('reports unsupported_platform on Android without touching native code', async () => {
    setup('android', mockNative);
    expect(await voice.getAvailability()).toEqual({ status: 'unsupported_platform' });
    await expect(voice.start(options)).rejects.toMatchObject({ code: 'unsupported_platform' });
    expect(() => voice.onEnd(() => undefined).remove()).not.toThrow();
    expect(mockNative.getAvailability).not.toHaveBeenCalled();
    expect(mockNative.addListener).not.toHaveBeenCalled();
  });

  it('fails closed when the dev client has no native module', async () => {
    setup('ios', null);
    expect(await voice.getAvailability()).toEqual({
      status: 'unsupported_platform',
      detail: 'native_module_missing',
    });
    await expect(voice.start(options)).rejects.toMatchObject({ code: 'unsupported_platform' });
    expect(await voice.installModel()).toBe('unsupported');
  });
});
