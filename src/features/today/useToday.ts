import { useEffect, useRef, useState } from 'react';
import { AppState } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { useAuthenticationConnectivity } from '@/features/auth/integration/useConnectivity';
import { planningKeys, usePlanning } from './PlanningProvider';
import { boundaryMarker, resolveTimeZone } from './time';
import type { TodayResource } from './types';
export const planningQueryPolicy = {
  retry: false,
  staleTime: 0,
  gcTime: 0,
  networkMode: 'always',
  refetchOnWindowFocus: false,
  refetchOnReconnect: false,
} as const;
export function useToday() {
  const planning = usePlanning(),
    connectivity = useAuthenticationConnectivity();
  const [timezone, setTimezone] = useState(resolveTimeZone);
  const marker = useRef(boundaryMarker(new Date(), timezone));
  const lastConfirmed = useRef<TodayResource>(undefined);
  const zone = timezone ?? 'unresolved';
  const query = useQuery({
    ...planningQueryPolicy,
    queryKey: planningKeys.today(planning.account, zone),
    enabled: Boolean(timezone) && connectivity !== 'offline',
    queryFn: ({ signal }) => planning.service.today(planning.credential(), zone, signal),
  });
  useEffect(() => {
    if (query.data && !query.isError) lastConfirmed.current = query.data;
  }, [query.data, query.isError]);
  const refetchRef = useRef(query.refetch);
  refetchRef.current = query.refetch;
  useEffect(() => {
    const refresh = (foreground = false) => {
      const nextZone = resolveTimeZone(),
        next = boundaryMarker(new Date(), nextZone);
      const changed = next !== marker.current;
      marker.current = next;
      setTimezone(nextZone);
      if (nextZone && nextZone === timezone && (changed || foreground)) void refetchRef.current();
    };
    const subscription = AppState.addEventListener('change', (state) => {
      if (state === 'active') refresh(true);
    });
    // Poll only a non-sensitive day/zone marker; network reads occur on change, not every tick.
    const timer = setInterval(() => {
      if (AppState.currentState === 'active') refresh();
    }, 30_000);
    return () => {
      subscription.remove();
      clearInterval(timer);
    };
  }, [timezone]);
  useEffect(() => {
    if (query.error) void planning.recover(query.error);
  }, [query.error, planning]);
  return {
    query,
    confirmedData: query.data ?? lastConfirmed.current,
    timezone,
    connectivity,
    refresh: () => {
      const next = resolveTimeZone();
      setTimezone(next);
      marker.current = boundaryMarker(new Date(), next);
      if (next && next === timezone) return query.refetch();
      return Promise.resolve(undefined);
    },
  };
}
