import { useRef, type RefObject } from 'react';
import { View } from 'react-native';
import { useShellDestination } from '@/features/app-shell/useShellDestination';
import { useReturnFocus } from '@/features/today/useReturnFocus';
import { routes } from '@/navigation';

/** Invoke only from a future approved contextual action; no route parameters or domain data. */
export function useNotificationPermission() {
  const open = useShellDestination();
  const fallback = useRef<View>(null);
  const mark = useReturnFocus(fallback);
  return (origin: RefObject<View | null>) => {
    mark(origin);
    open(routes.app.notificationPermission);
  };
}
