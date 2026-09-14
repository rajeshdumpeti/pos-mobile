# Typed API layer (Milestone 1.F)

The dependency direction is `feature controller → React Query (1.G) → typed feature service → shared HTTP client → platform fetch`. API code never imports feature or screen code.

## Contract provenance

`src/api/contract/openapi.json` was generated from backend `origin/develop` commit `c2f2ddeb20e03fca32062119fb59845892a46224`, API **POS Local Mock API 0.1.0**, Authentication Contract **1.1.0**. It contains no backend environment values or secrets. `npm run api:generate` deterministically creates the marked generated TypeScript schema; `npm run api:check` regenerates into a temporary file and fails on drift. To refresh, archive/check out the reviewed backend commit outside this repository, generate `create_app().openapi()`, replace the snapshot and metadata together, then run both commands and review the contract diff. Mobile runtime never accesses the backend repository.

## Configuration and transport

`EXPO_PUBLIC_API_URL` contains an origin only and is public configuration, never a secret. HTTPS is required for staging and production. Development HTTP is limited to loopback, `10.0.2.2`, and private-network addresses. iOS Simulator commonly reaches a host service through `127.0.0.1`; Android Emulator commonly uses `10.0.2.2`. Physical devices need a reachable private-network host. No production fallback exists.

The client allow-lists Authentication and health paths, prohibits query strings and absolute request paths, sends JSON headers only when appropriate, uses `credentials: omit` and `redirect: error`, and sends a backend-compatible request ID. A supplied valid ID is preserved; invalid IDs are replaced by the injected factory. A per-request bearer seam validates credentials and never stores or logs them.

Timeout and caller cancellation share a local AbortController, preserve distinct safe errors, and clean up timers/listeners. There are no automatic retries. Authentication mutations must be explicitly initiated; future idempotent GET retry belongs in React Query. Server retry metadata is validated and no countdown is fabricated.

Success requires an expected status and valid content handling. Empty 204 responses are supported. JSON, content type, structured backend errors, field details, request IDs, and retry metadata are checked. Raw HTML, bodies, request payloads, headers, credentials, tokens, codes, passwords, reset tokens, emails, and query strings never escape through diagnostics or errors.

The Authentication service exposes only OpenAPI-proven operations: registration policy, registration, verification, resend, unverified-email change, sign-in, refresh, current session, current/all-session deletion, reset request, and reset confirmation. It does not persist credentials, navigate, mutate session state, retry, or create fake responses.

Milestone 1.G will connect `React Hook Form values → submission intent → React Query mutation → Authentication service → API result/error → Authentication domain mapping → session transition → navigation policy`. Secure storage, refresh coordination, real API calls from controllers, and the locked Authentication completion gate remain incomplete.

## Milestone 1.G.1 integration boundary

Authentication API errors are mapped into feature-domain failures outside the shared API layer. Per-request credentials come from the private credential vault through future controllers; the HTTP client does not own, persist, refresh, or expose them. See [authentication-integration.md](authentication-integration.md).
