import { Href, useRouter } from 'expo-router';
import { useCallback } from 'react';

import { AuthRoutePath } from '@/features/authentication/constants/authentication';

export function useAuthRouteNavigation() {
  const router = useRouter();
  const onNavigate = useCallback((path: AuthRoutePath) => router.push(path as Href), [router]);
  const onBack = useCallback(() => router.back(), [router]);
  const onContinueToPOS = useCallback(() => router.replace('/(app)/(tabs)' as Href), [router]);
  return { onNavigate, onBack, onContinueToPOS };
}
