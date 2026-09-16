# Authentication resilience and security hardening (1.G.5)

Authentication transport failures are mapped once at the integration boundary. Screens receive
fixed safe failures, never `ApiError`, HTTP status logic, response bodies, headers, or URLs. Every
Authentication mutation uses `retry: false`, `networkMode: "always"`, and `gcTime: 0`: an explicit
tap executes immediately, duplicate taps are coalesced, and reconnect never queues or replays a
registration, verification, sign-in, sign-out, or password-recovery intent.

## Connectivity and explicit recovery

The Authentication-owned NetInfo adapter exposes only `unknown`, `online`, or `offline`. Unknown
does not claim the device is offline; connectivity is a presentation hint and the actual transport
result remains authoritative. The adapter shares one native subscription, cleans it up after its
last consumer, persists nothing, and exposes no network or device details. Reconnection can update
presentation but cannot invoke a mutation. Retry, resend, policy refresh, restoration retry, and
workflow restart remain explicit user actions.

## Retry timing

Public rate limits accept only bounded integer `Retry-After`/`retry_after_seconds` values from 1 to
3,600 seconds. A valid header takes precedence over the body value. Verification resend may also
use a validated future `retry_at` no more than one hour ahead; relative timing takes precedence.
Malformed, past, negative, non-finite, and excessive values are discarded. Absolute deadlines are
recomputed after foregrounding, countdowns clamp at zero, and reaching zero only enables the action.
It never submits automatically. Countdown labels are not live regions, so screen readers are not
notified every second.

## Session and credential failures

Restoration distinguishes missing storage from offline, timeout, and unavailable outcomes. A
retryable restoration failure retains the SecureStore refresh credential and exposes an explicit
single-flight retry operation; terminal invalid, expired, replayed, conflicting, malformed-response,
or secure-persistence failures clear credentials. An ambiguous refresh retains the same old refresh
credential and idempotency key for its explicit retry. Successful rotation still persists the new
refresh credential before exposing the new access credential, and revision guards prevent stale
restoration from overwriting sign-out or a newer session.

Current-device and all-session sign-out clear local access immediately before remote revocation, so
protected content becomes inaccessible even offline. Current-device remote failure remains locally
signed out. All-session sign-out returns a safe confirmation boolean; the UI must not claim remote
revocation when it is false. Neither operation refreshes solely to sign out or queues work for later.

## Privacy and diagnostics

Request IDs are limited to the contract-safe character set and length. Invalid IDs are discarded.
Only allow-listed codes, actions, and timing metadata survive error mapping. HTML, malformed JSON,
unexpected content types/statuses, raw messages, bodies, headers, credentials, and query-bearing URLs
never reach presentation. Authentication values remain absent from logs, analytics, query keys,
routes, Context/session state, and persistence other than the approved SecureStore refresh envelope.

During 1.H, a founder may provide a displayed safe request ID to an authorized backend operator to
correlate fixed diagnostics; never copy a request body, incoming reset URL, credential, or code.
Founder acceptance must cover offline/reconnect behavior, explicit retries, cooldowns, malformed
responses, restoration/refresh failure, both sign-out modes, and log inspection on iOS and Android.
Real device/backend behavior is not claimed here. The unchanged 15-point Authentication gate remains
in [`authentication-state.md`](authentication-state.md); this milestone implements gates 12–14.
