import { useShellDestination } from '@/features/app-shell/useShellDestination';
import { routes } from '@/navigation';
import { destinationForAction } from './actions';
import type { PlanAction } from './types';
export function usePlanAction() {
  const open = useShellDestination();
  return (action: PlanAction, id?: string | null) => {
    const target = destinationForAction(action, id);
    if (!target) return;
    if (target.kind === 'create') open(routes.app.planItemNew);
    else if (target.kind === 'edit')
      open({ pathname: routes.app.planItemEdit, params: { id: target.id } });
    else open({ pathname: routes.app.planItem, params: { id: target.id } });
  };
}
