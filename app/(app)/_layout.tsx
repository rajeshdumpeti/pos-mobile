import { Slot } from 'expo-router';

import { ProtectedAppBoundary } from '@/navigation';

export default function AppLayout() {
  return (
    <ProtectedAppBoundary>
      <Slot />
    </ProtectedAppBoundary>
  );
}
