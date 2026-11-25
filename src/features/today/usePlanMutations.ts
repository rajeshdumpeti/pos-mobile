import { useRef, useState } from 'react';
import { useAuthenticationConnectivity } from '@/features/auth/integration/useConnectivity';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { ApiError } from '@/api';
import type { EntrySource } from '@/api/client';
import type { CreatePlanItem, PlanItem, UpdatePlanItem } from './types';
import { mapPlanningFailure, type PlanningFailure } from './failure';
import { planningKeys, usePlanning } from './PlanningProvider';
export const planningMutationPolicy = { retry: false, networkMode: 'always', gcTime: 0 } as const;
export function usePlanMutations(id?: string, options: { entrySource?: EntrySource } = {}) {
  const planning = usePlanning(),
    client = useQueryClient(),
    busy = useRef(false),
    connectivity = useAuthenticationConnectivity();
  const [failure, setFailure] = useState<PlanningFailure>();
  const [reviewRequired, setReviewRequired] = useState(false);
  const [reviewReady, setReviewReady] = useState(false);
  const onSuccess = async (item: PlanItem | undefined) => {
    if (!planning.current()) throw new ApiError('cancelled', 'Planning access changed.');
    if (!item) return;
    // Reset all account-owned date pages, including old/new assignments. Active boards refetch page one.
    await client.resetQueries({ queryKey: [...planningKeys.account(planning.account), 'plan'] });
    client.setQueryData(planningKeys.item(planning.account, item.id), item);
    setFailure(undefined);
    await client.invalidateQueries({
      queryKey: [...planningKeys.account(planning.account), 'today'],
    });
  };
  const onError = async (error: unknown) => {
    if (!planning.current()) return;
    const mapped = mapPlanningFailure(error);
    setFailure(mapped);
    if (
      id &&
      (mapped.kind === 'conflict' || mapped.kind === 'ambiguous' || mapped.kind === 'offline')
    ) {
      setReviewRequired(true);
      setReviewReady(false);
      try {
        const latest = await planning.service.get(planning.credential(), id);
        if (planning.current()) {
          client.setQueryData(planningKeys.item(planning.account, id), latest);
          setReviewReady(true);
        }
      } catch {
        /* Explicit retry is required; never acknowledge a failed refresh. */
      }
    }
    await planning.recover(error);
  };
  const create = useMutation({
    ...planningMutationPolicy,
    mutationKey: [...planningKeys.account(planning.account), 'create'],
    mutationFn: (payload: CreatePlanItem) =>
      planning.creation.submit(payload, (body, key) =>
        planning.service.create(planning.credential(), body, key, {
          entrySource: options.entrySource ?? 'manual',
        }),
      ),
    onSuccess,
    onError,
  });
  const update = useMutation({
    ...planningMutationPolicy,
    mutationKey: [...planningKeys.account(planning.account), 'update'],
    mutationFn: (payload: UpdatePlanItem) =>
      planning.service.update(planning.credential(), id!, payload),
    onSuccess,
    onError,
  });
  const complete = useMutation({
    ...planningMutationPolicy,
    mutationKey: [...planningKeys.account(planning.account), 'complete'],
    mutationFn: (version: number) => planning.service.complete(planning.credential(), id!, version),
    onSuccess,
    onError,
  });
  const run = async (operation: () => Promise<PlanItem | undefined>) => {
    if (busy.current || reviewRequired) return;
    if (connectivity === 'offline') {
      setFailure(mapPlanningFailure(new ApiError('network', 'Planning is offline.')));
      return;
    }
    busy.current = true;
    setFailure(undefined);
    try {
      return await operation();
    } catch {
      return undefined;
    } finally {
      busy.current = false;
    }
  };
  return {
    failure,
    reviewRequired,
    reviewReady,
    busy: create.isPending || update.isPending || complete.isPending,
    create: (payload: CreatePlanItem) => run(() => create.mutateAsync(payload)),
    update: (payload: UpdatePlanItem) => run(() => update.mutateAsync(payload)),
    complete: (version: number) => run(() => complete.mutateAsync(version)),
    acknowledgeReview: () => {
      if (reviewReady) {
        setReviewRequired(false);
        setFailure(undefined);
      }
    },
    confirmReview: () => {
      setReviewReady(true);
    },
  };
}
