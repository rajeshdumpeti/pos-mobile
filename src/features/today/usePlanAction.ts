import { useShellDestination } from '@/features/app-shell/useShellDestination';
import { routes } from '@/navigation';
import { destinationForAction } from './actions';
import type { PlanAction } from './types';
import type { PlanContext } from '@/features/plan/calendar';
export function usePlanAction(context?: PlanContext) {
  const open = useShellDestination();
  return (action: PlanAction, id?: string | null) => {
    const target = destinationForAction(action, id);
    if (!target) return;
    if (target.kind === 'create')
      open(
        context ? { pathname: routes.app.planItemNew, params: context } : routes.app.planItemNew,
      );
    else if (target.kind === 'edit')
      open({ pathname: routes.app.planItemEdit, params: { id: target.id, ...context } });
    else open({ pathname: routes.app.planItem, params: { id: target.id, ...context } });
  };
}
