# Email sign-in and session lifecycle — Milestone 1.G.3

## Architecture and contract

Sign In preserves the established path: React Hook Form and Zod feed a feature
controller, React Query owns the explicit mutation, the generated-contract service
uses the shared HTTP client, and a single session workflow owns credential custody
and token-free presentation state. The frozen endpoints are `POST /api/v1/auth/sessions`,
`POST /api/v1/auth/sessions/refresh`, `GET /api/v1/auth/session`, and
`DELETE /api/v1/auth/session`. Authentication Contract 1.1.0 has no `remember_me`
field, so mobile sends only email and the password exactly as entered.

Verified sign-in commits the access credential to the in-memory vault and the refresh
credential to the existing OS SecureStore adapter before publishing a token-free
signed-in account summary. A partial secure-storage failure clears all credential
state and fails closed. No credential is stored in Context, React Query persistence,
AsyncStorage, routes, URLs, logs, or analytics.

An `email_not_verified` response is an approved typed result. Its continuation moves
directly into the existing transient registration workflow and navigation replaces
Sign In with Verify Email. No resend occurs automatically.

## Restoration, refresh, logout, and navigation

Production starts in `restoring`; protected and Authentication boundaries show the
neutral checking screen until secure storage inspection finishes. A stored refresh
credential is rotated once with a per-attempt idempotency key, then current-session
facts are fetched. Concurrent initialization and refresh calls share one promise.
Terminal refresh failures clear credentials. Temporary transport or dependency
failures never authenticate the user and retain a potentially usable refresh credential.

Logout calls the current-device endpoint when an access credential exists, but local
credential destruction remains authoritative when the network is unavailable. It also
clears transient verification state and user-scoped query data, then replaces history
with Welcome. Existing route boundaries protect content throughout bootstrap.

The integration provider retains one workflow instance across rerenders. Authenticated
route replacement may unmount the Sign In controller immediately after the workflow
publishes signed-in state; that expected unmount never clears the established session.
A workflow revision guard also prevents an older bootstrap or refresh result from
overwriting a newer successful sign-in.

The behavior is platform-equivalent; the existing SecureStore adapter maps to iOS
Keychain and Android Keystore. Password recovery, social authentication, biometrics,
authorization, account linking, onboarding UI, and production worker orchestration
remain deferred.

## Founder physical-device sequence

1. Start the backend and mobile app on a physical device.
2. Confirm invalid credentials show one generic error and clear the password.
3. Sign in to an unverified account and confirm navigation to Verify Email.
4. Run the backend bounded outbox worker; confirm provider acceptance and receipt.
5. Try an incorrect code, then the received code through the mobile UI.
6. Sign in to the verified account and confirm authenticated entry.
7. Restart the app and confirm restoration without protected-content flicker.
8. Log out and confirm Back cannot reopen the authenticated route.
9. Repeat launch, sign-in, and logout checks offline and confirm safe recovery.
10. Confirm Metro, backend, and device logs contain no password, code, or credential.
