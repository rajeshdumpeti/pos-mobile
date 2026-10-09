import type { PlanAction, RecommendationCode, SectionState } from './types';
export const supportedActions: readonly PlanAction[] = [
  'plan_item.create',
  'plan_item.view',
  'plan_item.update',
  'plan_item.complete',
];
export type ActionDestination =
  | { kind: 'create' }
  | { kind: 'detail'; id: string }
  | { kind: 'edit'; id: string }
  | { kind: 'complete'; id: string };
export function destinationForAction(
  action: PlanAction,
  id?: string | null,
): ActionDestination | undefined {
  switch (action) {
    case 'plan_item.create':
      return { kind: 'create' };
    case 'plan_item.view':
      return id ? { kind: 'detail', id } : undefined;
    case 'plan_item.update':
      return id ? { kind: 'edit', id } : undefined;
    case 'plan_item.complete':
      return id ? { kind: 'complete', id } : undefined;
  }
}
export function visibleActions(actions: readonly string[]): PlanAction[] {
  return supportedActions.filter((action) => actions.includes(action));
}
export const recommendationCopy: Record<RecommendationCode, { title: string; reason: string }> = {
  priority_past_start: {
    title: 'Your scheduled priority is ready',
    reason: 'An explicit priority has reached its scheduled start.',
  },
  past_start: {
    title: 'Your scheduled item is ready',
    reason: 'An incomplete item has reached its scheduled start.',
  },
  priority_upcoming: {
    title: 'Your next scheduled priority',
    reason: 'This is the next upcoming item you marked as a priority.',
  },
  upcoming: { title: 'Your next scheduled item', reason: 'This is your next upcoming plan item.' },
  priority_unscheduled: {
    title: 'Make time for your priority',
    reason: 'You marked an unscheduled item as a priority for this day.',
  },
  unscheduled: {
    title: 'Your next plan item',
    reason: 'An incomplete item is assigned to this day without a start time.',
  },
  create_first_plan_item: {
    title: 'Start with one plan item',
    reason: 'No plan items are assigned to this day.',
  },
  all_plan_items_complete: {
    title: 'Your current plan is complete',
    reason: 'There are no remaining items in this day’s plan.',
  },
};
export const sectionCopy: Record<Exclude<SectionState, 'available'>, string> = {
  empty: 'Nothing here yet.',
  no_data: 'No current information has been recorded.',
  unavailable: 'This information is not available yet.',
  partial: 'Some information is unavailable.',
  stale: 'This information may be out of date.',
  error: 'We couldn’t load this section.',
};
