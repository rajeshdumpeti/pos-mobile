import { Href, useRouter } from 'expo-router';
import { useMemo } from 'react';

const destinations = {
  Today: '/(app)/(tabs)',
  Plan: '/(app)/(tabs)/plan',
  Log: '/(app)/(tabs)/log',
  Focus: '/(app)/(tabs)/focus',
  Review: '/(app)/(tabs)/review',
  Timeline: '/(app)/timeline',
  Nutrition: '/(app)/nutrition',
  Weight: '/(app)/weight',
  Workout: '/(app)/workout',
  Money: '/(app)/money',
  Notifications: '/(app)/notifications',
  Search: '/(app)/search',
  Profile: '/(app)/profile',
  Settings: '/(app)/settings',
} as const;

type Params = { type?: string };

export function usePrototypeNavigation() {
  const router = useRouter();

  return useMemo(
    () => ({
      navigate(name: string, params?: Params) {
        if (name === 'QuickAdd') {
          router.push({ pathname: '/modal/quick-add', params } as Href);
          return;
        }
        if (name in destinations) {
          router.push(destinations[name as keyof typeof destinations] as Href);
          return;
        }
        throw new Error(`Unknown prototype destination: ${name}`);
      },
      goBack() {
        if (router.canGoBack()) {
          router.back();
        } else {
          router.replace('/(app)/(tabs)' as Href);
        }
      },
    }),
    [router],
  );
}
