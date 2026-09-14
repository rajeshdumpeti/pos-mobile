# Registration and email verification integration — 1.G.2

Backend `origin/develop` commit `c2f2ddeb20e03fca32062119fb59845892a46224`
defines POS API `0.1.0`, Authentication Contract `1.1.0`. The checked-in OpenAPI
snapshot and generated TypeScript types come from that exact revision.

The runtime path is `React Hook Form → Zod → feature controller → React Query →
typed Authentication service → shared HTTP client → POS backend`. The backend
alone selects `required` or `deferred_nonproduction` legal policy. Policy state
is not persisted, is not inferred from the mobile environment, has no fallback,
and is explicitly retried by the user after failure.

Deferred policy hides legal controls and omits all four legal request properties.
Required policy accepts only internally consistent responses with HTTPS document
URLs, displays separate accessible links and initially unchecked controls, and
submits the exact backend versions only after both affirmative actions. Policy
errors refetch without automatically resubmitting and remount consent unchecked.

The Authentication integration provider owns a private closure containing only
the opaque verification flow token and validated presentation metadata. UI can
subscribe only to masked email and authoritative timestamps. Registration,
resend, and change-email responses atomically replace that context. Confirmation,
expiry, cancellation, and navigation away clear it. Process death safely loses
the context and Verify Email presents a signed-out recovery path.

All Authentication mutations use PII-free keys, `retry: false`, `networkMode:
always`, and `gcTime: 0`. Mutation variables are reset immediately after handling.
Offline attempts execute once and require another user action. Codes, passwords,
emails, and flow tokens never enter routes, query keys, persistent state, or safe
domain errors. Verification returns no session, clears the workflow, remains
signed out, and shows a one-time safe success message on Sign In.

The mobile application has no email-provider dependency or credentials:

`POS mobile → POS backend Authentication API → backend-owned email provider → inbox`

## Founder real-email runbook

Use placeholders in notes and terminal history; never paste credentials, flow
tokens, passwords, or codes into source control or reports.

1. Configure the reviewed backend revision with a disposable database, Redis
   when required, Authentication keys, sender configuration, and a functioning
   backend-owned email provider in its ignored local environment.
2. For local testing without production legal documents, configure backend
   policy as `deferred_nonproduction`; confirm policy returns null legal fields.
3. Set mobile `EXPO_PUBLIC_API_URL` to the reachable backend origin in an ignored
   local file. Never place secrets in an `EXPO_PUBLIC_` variable.
4. Start the backend with its documented secure command and start Expo with
   `npm start` without generating native projects.
5. Register a founder-controlled disposable real address and confirm the app
   reports only backend acceptance.
6. Confirm a real inbox message arrives, enter its real code, and verify the app
   returns signed out to Sign In.
7. Test one incorrect code; request resend after the backend deadline and confirm
   the newly delivered code succeeds.
8. Test expiry when the environment provides a safe time-control mechanism.
9. Change to another founder-controlled disposable inbox and confirm only the
   backend-provided masked destination appears.
10. Confirm logs contain no raw email, password, code, flow token, request body,
    or provider credential.

This implementation does not prove inbox delivery; founder testing does.
Production legal documents, official versions/HTTPS URLs, legal review, and
store readiness remain release gates. Sign-in credential commitment, refresh,
restoration, logout, recovery, broader hardening, and protected routing remain
1.G.3–1.G.5 and 1.H work.
