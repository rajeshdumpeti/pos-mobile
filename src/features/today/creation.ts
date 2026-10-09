import { ApiError } from '@/api';
import type { CreatePlanItem, PlanItem } from './types';
import { isAmbiguousCreation } from './failure';
let sequence = 0;
export function creationKey() {
  return `plan-${Date.now().toString(36)}-${++sequence}-${Math.random().toString(36).slice(2, 14)}`;
}
export type CreationAttempt = {
  readonly key: string;
  readonly payload: Readonly<CreatePlanItem>;
  readonly serialized: string;
};
/** Account-lifetime memory only. A retry submits a frozen, identical logical intent. */
export function createCreationCoordinator(keyFactory = creationKey) {
  let attempt: CreationAttempt | undefined;
  let busy = false;
  let reconcile = false;
  return {
    getAttempt: () => attempt,
    needsReconciliation: () => reconcile,
    isBusy: () => busy,
    reset: () => {
      if (!busy) {
        attempt = undefined;
        reconcile = false;
      }
    },
    submit: async (
      payload: CreatePlanItem,
      send: (body: CreatePlanItem, key: string) => Promise<PlanItem>,
    ): Promise<PlanItem | undefined> => {
      if (busy) return undefined;
      const serialized = JSON.stringify(payload);
      if (attempt && attempt.serialized !== serialized)
        throw new ApiError('configuration', 'Review the original creation attempt.');
      attempt ??= { key: keyFactory(), payload: Object.freeze({ ...payload }), serialized };
      const current = attempt;
      busy = true;
      try {
        const result = await send({ ...current.payload }, current.key);
        attempt = undefined;
        reconcile = false;
        return result;
      } catch (error) {
        reconcile =
          isAmbiguousCreation(error) ||
          (error instanceof ApiError && error.metadata.code === 'plan_item_idempotency_conflict');
        if (!reconcile) attempt = undefined;
        throw error;
      } finally {
        busy = false;
      }
    },
  };
}
export type CreationCoordinator = ReturnType<typeof createCreationCoordinator>;
