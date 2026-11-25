import type { PlanDraft } from '@/features/today/draft';

/**
 * One-shot, in-memory handoff for "Type it instead" (VX-23). It is module-level on purpose:
 * route params would put the words into navigation state. It is cleared on read, on sign-out
 * and whenever a voice session is purged.
 */
let pending: Partial<PlanDraft> | undefined;

export function setVoicePrefill(value: Partial<PlanDraft> | undefined): void {
  pending = value;
}

export function takeVoicePrefill(): Partial<PlanDraft> | undefined {
  const value = pending;
  pending = undefined;
  return value;
}

export function clearVoicePrefill(): void {
  pending = undefined;
}
