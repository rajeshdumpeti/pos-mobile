import { FoundationScreen } from '@/features/foundation/FoundationScreen';
import { useState } from 'react';
import { useRouter } from 'expo-router';
import { useQueryClient } from '@tanstack/react-query';
import { useAuthenticationCapabilities } from '@/features/auth/integration';
import { routes } from '@/navigation';

export default function AppIndexRoute() {
  const { session } = useAuthenticationCapabilities();
  const queryClient = useQueryClient();
  const router = useRouter();
  const [loggingOut, setLoggingOut] = useState(false);
  return (
    <FoundationScreen
      loggingOut={loggingOut}
      onLogout={() => {
        if (loggingOut) return;
        setLoggingOut(true);
        void session.logout().finally(() => {
          queryClient.clear();
          router.replace(routes.auth.welcome);
        });
      }}
    />
  );
}
