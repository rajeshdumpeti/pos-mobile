# Password recovery integration (1.G.4)

Forgot Password sends one explicit `POST /api/v1/auth/password-resets` intent through the typed
Authentication service and centralized React Query policy. Retry, reconnect replay, and mutation
retention are disabled. A `202 instructions_if_eligible` response leads to generic acknowledgement
copy; it proves neither account existence nor inbox delivery. Email delivery remains backend-owned.
The address is cleared after acceptance and never enters a route, query key, store, or workflow.

## Reset-link boundary and custody

`PasswordResetLinkIngress` is the single cold- and warm-start Linking boundary. Development accepts
exactly `pos://reset-password?token=<opaque-value>`: exact scheme/host, empty or `/` path, and one
`token`. Credentials, fragments, duplicates, missing/empty/extra parameters, control characters,
tokens outside the backend's 43–128 character bounds, and unexpected schemes, hosts, or paths are
rejected. Incoming URLs are never logged or included in errors.

Expo configuration explicitly registers the `pos` application scheme. In the URL representation
delivered by React Native Linking, `pos:` is the scheme, `reset-password` is the host, and the path
is empty (a trailing slash is also tolerated). Expo Router's token-free route component remains
`/(auth)/reset-password`; the host is an external-link address, not a route parameter.

The opaque token moves once into a closure owned by `passwordRecoveryWorkflow`. Context exposes
workflow operations and safe state only, never the token. It is not decoded, normalized, trimmed,
persisted, put in a form/query key/session/route, or documented in fixtures. The credential-bearing
external route is replaced by the token-free Reset Password route. Duplicate delivery is idempotent;
a newer valid link replaces the old continuation. Memory loss fails closed, and direct route access
shows a safe unavailable state.

## Confirmation and failures

The form owns only `password` and UI-only `confirmPassword`; confirmation submits exactly `token`
and `new_password`. Success clears token and fields, clears local session state because Contract
1.1.0 revokes all sessions, and replaces navigation with Password Updated, whose action returns to
Sign In. Invalid/expired responses erase the continuation. Password rejection, network, timeout,
cancellation, dependency, rate-limit, and server failures use fixed safe mappings; retryable failures
retain the continuation for a new explicit intent. Valid request IDs and bounded Retry-After metadata
survive mapping while raw bodies do not.

Receiving a link while signed in does not itself clear the session or change accounts. Existing
navigation policy permits the isolated recovery route without exposing protected content. Only a
confirmed reset performs complete local session cleanup.

## Staging/production and founder verification

No production domain is configured here. Before staging/production, select the founder-owned HTTPS
domain, configure backend `AUTH_PASSWORD_RESET_URL`, publish Apple AASA and Android `assetlinks.json`,
add Expo associated domains/intent filters, and build both apps. Universal Links and Android App
Links are not production-ready until those prerequisites are complete.

Opening the registered custom application scheme requires an installed POS development build;
Expo Go is not evidence that the POS scheme works. Development-build custom-scheme verification and
real-device opening remain part of 1.H alongside production Universal/App Link configuration.

Founder verification in 1.H should use a designated placeholder test account: request a real email;
open cold/warm links on iOS/Android; test valid, invalid, expired, and replayed links; verify the old
password fails and new password signs in; and confirm pre-reset sessions are invalidated. Do not
record credentials or incoming URLs. The unchanged 15-point gate remains in
[`authentication-state.md`](authentication-state.md); this milestone implements the mobile basis
for gates 8–11 without claiming real inbox/backend/device acceptance.
