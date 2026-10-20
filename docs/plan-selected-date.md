# Plan v1 selected-date frontend

Implemented on `feat/plan-selected-date`, based on mobile `91f5eeb51da6d123ed6c6872c425f670a3c58429`. Contract: backend `146df660844019ff0052ccd05201e860deb48360`, `/api/v1/plan`, contract version `1.0`. Backend was inspected read-only. OpenAPI snapshot and generated types match that delivery.

Plan uses the existing authenticated shell, Today cards, violet theme, native date picker and shared item modals. Reference images informed hierarchy only. Unsupported coaching, nutrition, quick logging and rescheduling gestures are absent. Date navigation, one authoritative insight, full-date summary, Scheduled, Unscheduled, Completed and Add appear in that order. Null percentage means no items; zero remains 0%. Priority is inline. Current-date timing labels follow the server; other dates use neutral schedules. Past completion describes current state, never a historical snapshot. Item times retain their stored timezone, with an explicit timezone label when it differs from the board.

Memory queries include account, date and timezone. Cancellation and separate keys prevent late previous-date responses rendering on the new date. Account teardown clears queries, drafts and creation state. Opaque pagination preserves server order, deduplicates IDs, guards repeated intents and distinguishes loaded counts from full-date totals. Explicit cursor recovery reloads page one. Refresh failures retain confirmed same-date content with safe stale/error copy. Confirmed shared mutations discard all cached Plan continuation pages for that account, invalidate old/new dates and Today, and never switch the selected board. There is no persisted queue, optimistic completion, automatic write retry or snapshot guarantee.

Plan creation defaults to the selected date, automatic timezone, unscheduled and priority off. Minimal validated route context carries only origin/date plus the existing item ID. Save/cancel returns to that board; edit/save returns to detail, then Back returns to Plan. Global Add keeps its established behavior. Shared idempotency/version-conflict safeguards and TODAY-01 native transitionEnd autofocus remain intact. Date and expansion fades are 230 ms; confirmed completed rows settle over 300 ms. Reduce Motion removes fades. Headings, state labels, native accessibility focus return and scroll-safe bottom spacing reuse established components.

## Founder acceptance setup

Use the approved backend, a verified account with onboarding complete, and the existing API configuration. Sign in normally; do not put credentials or fixture records in source. Tests use synthetic fixtures only.

1. Inspect empty, populated and all-completed dates in light/dark themes, narrow layouts and large text. Check VoiceOver/TalkBack, keyboard actions, modal transitionEnd autofocus, return focus and final-row clearance above tabs.
2. Navigate prev/next across month/year and DST boundaries, use Today and the picker, and change dates rapidly during delayed requests. Check foreground timezone changes and authoritative current/past/future labels.
3. Create from a non-today Plan date, cancel, save, reopen detail, edit and save. Move the item to another date: the original board stays selected and reloads. Confirm Today also refreshes. Complete deliberately; only backend confirmation moves the item.
4. Seed more than 50 items and more than three completed items. Expand/collapse, paginate, double-tap Load more, invalidate a cursor, and use Reload date. Compare loaded counts with full-date totals; concurrent writes are not snapshot-consistent.
5. Interrupt refresh/paging and go offline. Confirm same-date content remains marked stale, safe request IDs appear, and no private error/cursor is shown. Check conflict, ambiguous creation retry, sign-out/account change and onboarding/session recovery.

## Validation and limitations

Full Jest: 63 suites / 460 tests passed, including selected-date contracts, calendar/DST, response races, pagination, summary/insight states, form defaults/return and mutation/account cleanup. Existing React act warnings remain visible and were not suppressed. Typecheck, lint, formatting, generated API drift, authentication readiness, brand assets, resolved public Expo configuration and iOS/Android exports passed. Exports are bundles, not native acceptance. Expo Doctor passed 18/20 checks; Expo API DNS/network access and React Native Directory response checks failed externally. No dependencies, native directories or builds were added.

Native Plan populated/empty and real form-return acceptance remain unverified until a working authenticated preview/device session is inspected. Founder manual verification is the next step; passing automated checks does not assert backend persistence, assistive-technology or visual acceptance.

## Delivery Git state

Mobile branch `feat/plan-selected-date`; HEAD `91f5eeb51da6d123ed6c6872c425f670a3c58429`. All changes are unstaged. No commit, push, PR, merge or deployment was performed. Backend remains clean at the approved SHA. No dependencies changed. Exact mobile `git status --porcelain=v1 --untracked-files=all`:

```text
 M app/(app)/(tabs)/plan.tsx
 M app/(app)/plan-item-edit.tsx
 M app/(app)/plan-item-new.tsx
 M app/(app)/plan-item.tsx
 M src/api/client/httpClient.ts
 M src/api/contract/contractMetadata.ts
 M src/api/contract/openapi.json
 M src/api/generated/schema.ts
 M src/features/today/PlanItemDetailScreen.tsx
 M src/features/today/PlanItemFormScreen.test.tsx
 M src/features/today/PlanItemFormScreen.tsx
 M src/features/today/PlanItemPage.tsx
 M src/features/today/PlanningProvider.tsx
 M src/features/today/hooks.test.tsx
 M src/features/today/service.test.ts
 M src/features/today/service.ts
 M src/features/today/usePlanAction.ts
 M src/features/today/usePlanMutations.ts
?? docs/plan-selected-date.md
?? src/features/plan/PlanScreen.test.tsx
?? src/features/plan/PlanScreen.tsx
?? src/features/plan/calendar.ts
?? src/features/plan/contracts.test.ts
?? src/features/plan/testFixtures.ts
?? src/features/plan/usePlanDate.test.tsx
?? src/features/plan/usePlanDate.ts
?? src/features/plan/validation.ts
```
