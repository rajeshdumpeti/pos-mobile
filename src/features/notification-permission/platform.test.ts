import { Linking, Platform } from 'react-native';
import { PermissionStatus } from 'expo';
import {
  IosAuthorizationStatus as IOS,
  IosAlertStyle,
  IosAllowsPreviews,
  type NotificationPermissionsStatus,
} from 'expo-notifications/build/NotificationPermissions.types';
import { interpretPermission, createNotificationPermissionAdapter } from './platform';
const mockCheck = jest.fn(),
  mockRequest = jest.fn();
const adapter = createNotificationPermissionAdapter(async () => ({
  getPermissionsAsync: mockCheck,
  requestPermissionsAsync: mockRequest,
}));
function response(status: IOS): NotificationPermissionsStatus {
  return {
    status: PermissionStatus.GRANTED,
    granted: true,
    canAskAgain: false,
    expires: 'never',
    ios: {
      status,
      allowsAlert: null,
      allowsBadge: null,
      allowsSound: null,
      allowsCriticalAlerts: null,
      allowsDisplayInCarPlay: null,
      allowsDisplayInNotificationCenter: null,
      allowsDisplayOnLockScreen: null,
      alertStyle: IosAlertStyle.NONE,
      allowsPreviews: IosAllowsPreviews.NEVER,
      providesAppNotificationSettings: null,
      allowsAnnouncements: null,
    },
  };
}
afterEach(() => {
  jest.restoreAllMocks();
  jest.clearAllMocks();
});
test.each([
  [IOS.NOT_DETERMINED, 'notDetermined'],
  [IOS.DENIED, 'denied'],
  [IOS.AUTHORIZED, 'authorized'],
  [IOS.PROVISIONAL, 'provisional'],
  [IOS.EPHEMERAL, 'ephemeral'],
] as const)(
  'iOS %s uses actual native authorization rather than generic granted',
  (status, authorization) => {
    expect(interpretPermission(response(status), 'ios')).toEqual({
      authorization,
      canAskAgain: false,
    });
  },
);
test('unknown iOS authorization fails closed', () => {
  const data = response(IOS.AUTHORIZED);
  delete data.ios;
  expect(() => interpretPermission(data, 'ios')).toThrow();
});
test('Android honors status and canAskAgain rather than contradictory generic granted', () => {
  const data = { ...response(IOS.AUTHORIZED), status: PermissionStatus.DENIED, canAskAgain: true };
  expect(interpretPermission(data, 'android')).toEqual({
    authorization: 'denied',
    canAskAgain: true,
  });
});
test('native adapter checks without requesting and shares concurrent native prompts', async () => {
  jest.replaceProperty(Platform, 'OS', 'ios');
  mockCheck.mockResolvedValue(response(IOS.NOT_DETERMINED));
  await adapter.check();
  expect(mockRequest).not.toHaveBeenCalled();
  mockRequest.mockResolvedValue(response(IOS.AUTHORIZED));
  await Promise.all([adapter.request(), adapter.request()]);
  expect(mockRequest).toHaveBeenCalledTimes(1);
  expect(mockRequest).toHaveBeenCalledWith({
    ios: { allowAlert: true, allowBadge: true, allowSound: true, allowProvisional: false },
  });
});
test('settings uses supported device API and failures reach the safe controller boundary', async () => {
  jest.replaceProperty(Platform, 'OS', 'android');
  const open = jest.spyOn(Linking, 'openSettings').mockRejectedValueOnce(new Error('unavailable'));
  await expect(adapter.openSettings()).rejects.toThrow();
  expect(open).toHaveBeenCalledTimes(1);
});
test('unsupported platforms neither import native permissions nor launch settings', async () => {
  jest.replaceProperty(Platform, 'OS', 'web');
  expect(await adapter.check()).toEqual({ authorization: 'unsupported', canAskAgain: false });
  expect(mockCheck).not.toHaveBeenCalled();
  await expect(adapter.openSettings()).rejects.toThrow();
});
