import { useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { planningKeys, usePlanning } from './PlanningProvider';
import { planningQueryPolicy } from './useToday';
export function usePlanItem(id: string | undefined) {
  const planning = usePlanning();
  const query = useQuery({
    ...planningQueryPolicy,
    queryKey: planningKeys.item(planning.account, id ?? 'unresolved'),
    enabled: Boolean(id),
    queryFn: ({ signal }) => planning.service.get(planning.credential(), id!, signal),
  });
  useEffect(() => {
    if (query.error) void planning.recover(query.error);
  }, [query.error, planning]);
  return query;
}
