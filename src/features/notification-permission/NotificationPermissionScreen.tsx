import { useEffect, useRef } from 'react';
import { BackHandler } from 'react-native';
import { routes, useSafeNavigation } from '@/navigation';
import { notificationPermissionAdapter } from './platform';
import { usePermission } from './usePermission';
import { NotificationPermissionView } from './NotificationPermissionView';

export function NotificationPermissionScreen() {
  const { state, controller } = usePermission(notificationPermissionAdapter);
  const { backOrReplace } = useSafeNavigation();
  const closing = useRef(false);
  const close = () => {
    if (closing.current) return;
    closing.current = true;
    controller.stop();
    backOrReplace(routes.app.index);
  };
  useEffect(() => {
    const subscription = BackHandler.addEventListener('hardwareBackPress', () => {
      close();
      return true;
    });
    return () => subscription.remove();
  });
  return (
    <NotificationPermissionView
      state={state}
      close={close}
      enable={() => {
        void controller.enable();
      }}
      retry={() => {
        void controller.check();
      }}
      settings={() => {
        void controller.settings();
      }}
    />
  );
}
