import { useCallback } from 'react';
import { useRouter } from 'expo-router';

import type { SafeFallbackRoute } from './routes';

export function useSafeNavigation() {
  const router = useRouter();

  const backOrReplace = useCallback(
    (fallback: SafeFallbackRoute) => {
      if (router.canGoBack()) {
        router.back();
        return;
      }
      router.replace(fallback);
    },
    [router],
  );

  const dismissOrReplace = useCallback(
    (fallback: SafeFallbackRoute) => {
      if (router.canDismiss()) {
        router.dismiss();
        return;
      }
      router.replace(fallback);
    },
    [router],
  );

  return { backOrReplace, dismissOrReplace };
}
