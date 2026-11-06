# Authentication state foundation (Milestone 1.E)

This milestone defines typed, token-free state boundaries. It does not authenticate anyone or complete Authentication. Backend validation remains authoritative; local schemas only give timely, accessible feedback.

## Ownership

| State category                                       | Owner                                        |
| ---------------------------------------------------- | -------------------------------------------- |
| Field values, touched/dirty state, client validation | React Hook Form                              |
| Client validation schemas                            | Zod                                          |
| Backend request/cache state                          | React Query                                  |
| Authentication operation state                       | Typed Authentication domain/controller model |
| Session lifecycle and identity boundary              | `SessionProvider`                            |
| Sensitive access/refresh credentials                 | Future secure-storage adapter                |
| Destination and route access                         | Expo Router navigation policy                |
| Appearance preference                                | Existing `ThemeProvider`                     |
| Server error authority                               | Backend Authentication contract              |
| Layout and visual composition                        | Authentication screens and shared components |

Forms keep passwords, confirmation values, codes, and email values local. Typed controlled adapters connect RHF to the existing fields without coupling the design system to RHF. Zod schemas mirror contract shape and length constraints, preserve leading zeroes in codes, and do not transform email input. Confirmation fields are omitted from submission intents.

`AuthOperationState` is a discriminated union of idle, submitting, succeeded, and failed. Its reducer cannot represent simultaneous outcomes. `mapAuthFailure` accepts known contract codes and validated diagnostic metadata, then returns fixed presentation copy. Raw payload text is discarded.

`SessionState` has restoring, signedOut, and signedIn variants. Signed-in carries only account id, optional display name, and onboarding need. `SessionNavigationAccess` maps restoring to checking and otherwise maps status directly; navigation continues to own redirects and route policy. Production has no restoration source yet and therefore starts deterministically signed out. Tests and future integration may inject controlled state. Consumers receive read-only state.

Context is sufficient for this narrow lifecycle boundary, so Zustand is deferred. There is no global form state or persistence. React Query owns request state, while the registration workflow keeps only the active opaque verification token in a closure outside presentation Context. The connection is:

`Form → Authentication controller → React Query mutation → typed API service → backend → mapped domain result → session transition/navigation`

The boundary ignores absent handlers and suppresses concurrent duplicate intents. Milestone 1.G.2 connects registration, verification, resend, and pre-verification email changes to generated transport types. Expo SecureStore is deferred until session credentials exist; AsyncStorage is never a credential store. Passwords, verification codes, verification/reset tokens, raw backend errors, and Authentication form values must not enter logs, analytics, route parameters, Context, or persistence.

## Authentication completion gate

Authentication can be declared complete only after all steps pass against a real backend environment:

1. A user creates an account with a real email address.
2. A real verification email arrives.
3. The verification code works.
4. Expired and incorrect codes are handled.
5. Resend delivers another valid code.
6. A verified user can sign in.
7. An unverified user is routed back to verification.
8. Forgot Password sends a real email.
9. The reset link opens POS safely.
10. A new password is accepted.
11. The old password stops working.
12. Session refresh and sign-out work.
13. Offline, rate-limited, and server-error states work.
14. No tokens or sensitive data appear in logs.
15. The complete flow passes on iOS and Android.

Afterward, deploy the authenticated build to staging and validate it end to end before the first POS product feature begins.

## Milestone 1.G.1 credential integration

The token-free session boundary now sits after the secure credential coordinator described in [authentication-integration.md](authentication-integration.md). Stored credential presence never changes presentation state without future authoritative backend validation.
