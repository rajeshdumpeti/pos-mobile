import { Linking, Platform } from 'react-native';
import {
  IosAuthorizationStatus,
  type NotificationPermissionsStatus,
} from 'expo-notifications/build/NotificationPermissions.types';
import type { Permission, PermissionAdapter } from './controller';

/** iOS authorization is more specific than the cross-platform granted boolean. */
export function interpretPermission(
  response: NotificationPermissionsStatus,
  platform: string,
  statuses: typeof IosAuthorizationStatus = IosAuthorizationStatus,
): Permission {
  if (platform === 'ios') {
    switch (response.ios?.status) {
      case statuses.AUTHORIZED:
        return { authorization: 'authorized', canAskAgain: false };
      case statuses.PROVISIONAL:
        return { authorization: 'provisional', canAskAgain: response.canAskAgain };
      case statuses.EPHEMERAL:
        return { authorization: 'ephemeral', canAskAgain: response.canAskAgain };
      case statuses.DENIED:
        return { authorization: 'denied', canAskAgain: response.canAskAgain };
      case statuses.NOT_DETERMINED:
        return { authorization: 'notDetermined', canAskAgain: response.canAskAgain };
      default:
        throw new Error('Notification authorization is unavailable.');
    }
  }
  if (platform === 'android') {
    return {
      authorization:
        response.status === 'granted'
          ? 'authorized'
          : response.status === 'denied'
            ? 'denied'
            : 'notDetermined',
      canAskAgain: response.canAskAgain,
    };
  }
  return { authorization: 'unsupported', canAskAgain: false };
}

const supported = () => Platform.OS === 'ios' || Platform.OS === 'android';
export function createNotificationPermissionAdapter(
  load: () => Promise<typeof import('expo-notifications/build/NotificationPermissions')>,
): PermissionAdapter {
  let request: Promise<Permission> | undefined;
  return {
    async check() {
      if (!supported()) return { authorization: 'unsupported', canAskAgain: false };
      // Import only permission APIs: the package root includes automatic push-token registration.
      // Lazy access also makes an old development client fail safely inside the experience.
      const native = await load();
      return interpretPermission(
        await native.getPermissionsAsync(),
        Platform.OS,
        IosAuthorizationStatus,
      );
    },
    request() {
      if (!request) {
        request = (async () => {
          if (!supported())
            return { authorization: 'unsupported', canAskAgain: false } as Permission;
          const native = await load();
          return interpretPermission(
            await native.requestPermissionsAsync({
              ios: {
                allowAlert: true,
                allowBadge: true,
                allowSound: true,
                allowProvisional: false,
              },
            }),
            Platform.OS,
            IosAuthorizationStatus,
          );
        })().finally(() => {
          request = undefined;
        });
      }
      return request;
    },
    async openSettings() {
      if (!supported()) throw new Error('Device settings are unavailable.');
      await Linking.openSettings();
    },
  };
}
export const notificationPermissionAdapter = createNotificationPermissionAdapter(
  () => import('expo-notifications/build/NotificationPermissions'),
);
