import { useShellDestination } from '@/features/app-shell/useShellDestination';
import { routes } from '@/navigation';
import { destinationForAction } from './actions';
import type { PlanAction } from './types';
import type { PlanContext } from '@/features/plan/calendar';
/** `entry` is a content-free origin marker carried to the create form (never user content). */
export function usePlanAction(context?: PlanContext, entry?: 'quick_log') {
  const open = useShellDestination();
  return (action: PlanAction, id?: string | null) => {
    const target = destinationForAction(action, id);
    if (!target) return;
    if (target.kind === 'create') {
      const params = { ...context, ...(entry ? { entry } : {}) };
      open(
        Object.keys(params).length > 0
          ? { pathname: routes.app.planItemNew, params }
          : routes.app.planItemNew,
      );
    } else if (target.kind === 'edit')
      open({ pathname: routes.app.planItemEdit, params: { id: target.id, ...context } });
    else open({ pathname: routes.app.planItem, params: { id: target.id, ...context } });
  };
}
