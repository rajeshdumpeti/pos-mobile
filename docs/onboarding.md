# Authoritative onboarding

Onboarding is an authenticated, server-authoritative workflow using contract `1.0` from backend `f6ae152085b0d2ee699f12b7798b328b436d69aa`. The app retrieves `/api/v1/onboarding`, saves explicit step choices with the latest `expected_version`, and enters Today only after `/complete` returns `completed` and the session is refreshed.

The eight mobile steps are POS Promise, How POS Works, priority areas, integration intent, goals and required unit/currency confirmation, notification preferences, POS Intelligence education, and completion. Configuration arrays supply all selectable identifiers. Goals, integrations, and notifications are optional. There is no Routine screen because the backend does not provide a Routine domain.

The Goals form renders only `optional_goal_fields` returned by the server. It restores authoritative values without creating defaults, preserves decimal text exactly, and validates the contract's integer bounds and positive-measurement rules before one explicit PATCH. Weight and water units follow the confirmed unit system; budget follows the confirmed currency. Empty goal inputs are omitted, while contract-valid zero values for workouts, focus minutes, and budget remain intact. Failed saves retain the in-memory draft.

Draft values live only in component memory. Query keys contain no account identifiers or choices, mutations never retry automatically, and errors never render backend messages. A conflict retains the same-runtime draft and requires an explicit retry after authoritative state is fetched.

On a version conflict, POS performs one bounded authoritative refetch and never resubmits the stale mutation. The screen enters a review-required state, retains safe drafts, removes only values no longer supported by refreshed configuration, and requires acknowledgment plus a new explicit save or completion action. A completion conflict never opens Today and returns to an unmet required step when readiness changed.

Offline, timeout, cancellation, authorization, validation, rate-limit, server, and malformed-response failures use fixed frontend-owned messages. Mutations use `networkMode: always` with retry disabled, so reconnect cannot replay a write. Offline and server failures retain runtime drafts. An ambiguous timeout refetches before another write. A terminal `401` delegates to the established session boundary; `403` prevents further onboarding mutations. Recognized validation fields receive fixed field errors, and raw backend prose is never rendered. Retry timing is displayed only when the shared HTTP boundary has already validated and bounded it.

Integration selections are intent only. Notification selections do not request operating-system permission. No provider SDK, native permission, push delivery, or personalized AI result is part of this milestone.

The composite design board guides hierarchy, cards, segmented progress, violet emphasis, and light/dark composition. Its pre-auth welcome, Routine, permission cards, search results, and quick actions are intentionally excluded from this authenticated contract-driven flow.

## Routing and restoration

Navigation has four authoritative access states. An unresolved session shows only neutral restoration UI; signed-out and terminally failed sessions go to Authentication; signed-in accounts requiring onboarding go directly to Onboarding; completed accounts go directly to Today. Direct navigation cannot bypass these boundaries. Completion remains on Onboarding until session refresh confirms `onboarding_required: false`, after which navigation is replaced with Today.

Version-zero users begin with the two educational screens. Returning users resume from `recommended_next_action`: priorities, required unit/currency, or readiness. Saved selections hydrate from GET, while refreshed configuration determines which controls remain available. No step number or draft is persisted.

## Accessibility and presentation

Every step has one semantic heading, an accessible “Step X of 8” progress value, ordered screen-reader traversal, selected states, fixed alert messages, accessible field hints, and keyboard-safe Goals inputs. Step changes use one concise accessibility announcement. The flow uses semantic light/dark tokens and contains no nonessential onboarding animation, so reduced-motion operation requires no alternate animated path.

## Founder manual acceptance checklist

- Test a newly verified incomplete account, a returning incomplete account, and a completed account against the real backend.
- Cold-launch each session state and confirm no Authentication, Onboarding, or Today flash.
- Save each supported preference and goal, relaunch, and verify authoritative hydration.
- Exercise stale-version, offline, rate-limit, timeout, server-error, and terminal-session paths.
- Complete onboarding, confirm Today replaces the flow, and verify Back cannot reopen it.
- Check VoiceOver/TalkBack, large text, keyboard behavior, reduced motion, light mode, and dark mode on physical devices.
- Confirm provider connections, native permissions, Routine creation, push delivery, and personalized AI remain absent.
