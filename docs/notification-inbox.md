# Notification Inbox — Screen 2

Inbox contract 1.0 is generated from backend `develop` commit
`98b9124cb26e179a3a001fab47981d0eeaf581db`. The snapshot was generated with
`create_app(app_settings=Settings(app_env="development", cors_origins=())).openapi()`
from a read-only Git archive of that commit, then `npm run api:generate`.
No backend environment file, running database or backend edits were needed.

The existing violet Notifications side panel now owns All / Today / Plan source filters,
server-defined Today / Earlier groups, full filtered unread counts, explicit load more,
refresh/restart and confirmed read operations. Group headings intentionally have no
loaded-page totals. The showcase's bottom tabs, Settings, Details, swipes, snooze,
skip and task completion are excluded. Existing light/dark tokens and reduced-motion
panel behavior remain in use. OS permission does not gate history or trigger a prompt.

`src/features/notifications` contains generated-contract aliases, strict runtime
validation, a shared authenticated HTTP service, session scope, queries and presentation.
No new dependencies or durable cache were added. Query keys contain only account ID,
source and grouping timezone; opaque cursors live only in infinite-query memory.
Account cleanup cancels requests and removes owned queries. Late reads and writes
check the live session; cancelled query responses cannot repopulate state.

The bell fetches source=all from unread-count, hides zero, displays 1–99 / 99+, and
labels failed/offline retained counts as potentially out of date. List counts are
filter-wide; single-read counts are global; read-all counts belong to the requested
source. Read mutations have a shared immediate intent lock, no optimistic read success,
no replay or automatic retry. They cancel older reads and reconcile affected lists and
counts. Read timestamps come from the backend. Pagination retains backend ordering,
deduplicates IDs, stops repeated cursors and preserves pages on errors. Explicit refresh
requests only page one while retaining confirmed content until its response arrives.

The account-scoped startup scope synchronizes a valid Intl IANA timezone, records
confirmation only after a validated success, deduplicates confirmed/in-flight values,
and rechecks on foreground. Failures leave Inbox reads available and offer explicit
retry. Onboarding accounts can synchronize timezone without fetching Inbox counts.

Navigation is allow-listed. Plan records open the existing owned-item detail flow after
an authoritative existence check; completed items are supported and Edit is never opened
automatically. Only UUID and selected date enter Router params. Unavailable records remain
visible and markable with fixed safe feedback. Native back retains the mounted Inbox
filter/pages/scroll and restores focus to the launching row.

**Product gap:** canonical backend docs explicitly identify `today.view.selected_date`
as historical evaluation context and do not define historical Today navigation. The current
Today screen has no historical API. Only a date matching a fresh authoritative Today response opens Today;
a historical notification is still markable and explains that historical Today views are
unavailable. It never silently opens a different day. Founder/product resolution is needed
before historical Today destinations can be enabled.

## Local founder verification

Follow backend `docs/notification-inbox.md` and
`docs/frontend-notification-inbox-handoff.md` at the SHA above. In an authorized local
environment, apply the reviewed `0008_notification_inbox` migration after `0007_background_jobs`
and configure existing authentication/onboarding dependencies. This frontend work does not
run migrations or change records outside ordinary authenticated user actions.

1. Sign in with a verified, completed-onboarding test account. Open Today and allow timezone
   synchronization. Inbox history remains available with OS notification permission denied.
2. Create a real incomplete Plan item with a future start within 15 minutes using the existing
   Plan editor. With the authorized backend environment already configured, explicitly run
   the documented bounded batch command from the backend directory:
   `.venv/bin/python -m app.infrastructure.job_worker process-pending 10`.
   The canonical producer revalidates ownership, occurrence and completion; no fake seed or
   public notification-create API exists. For an item farther in the future, run a batch only
   once the starting-soon job is due.
3. Open the bell and verify the real Plan row, global badge, read timestamp preservation,
   Plan detail/back behavior, scoped mark-all, refresh and pagination if enough real records exist.
4. Today records require incomplete assigned items and a due 18:00 evaluation in the stored
   account timezone. Use the same documented worker batch after that evaluation is due.
   Zero incomplete items produces no fabricated row. The next local-day job is scheduled by
   the worker. Never change device time to claim a backend producer ran.
5. Verify both source filters can contain Earlier records; compare authoritative counts
   against another session. Test logout/account transition, expired history, connectivity loss,
   missing targets and invalid-cursor restart using an authorized test environment.

Native OS permission, VoiceOver/TalkBack, large text, narrow displays, practical scroll/focus
restoration and both iOS/Android visual fidelity need founder device verification. This task
runs no EAS build, prebuild or native project generation. An installed development client
must include the previously added expo-notifications native module; rebuild that client
through the approved native workflow if its binary predates the dependency. This feature
adds no further native dependency, token registration or push delivery.
