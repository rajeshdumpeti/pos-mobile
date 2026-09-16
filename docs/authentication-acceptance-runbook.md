# Authentication acceptance runbook (1.H)

This runbook prepares founder-controlled acceptance; it does not claim that an account, email,
device, build, backend, or external service has been tested. Authentication is incomplete until all
15 gates pass on the required platforms. Complete development acceptance before staging, then
complete staging validation before product-feature development.

Official Expo references: [development builds](https://docs.expo.dev/develop/development-builds/introduction/),
[EAS build profiles](https://docs.expo.dev/build/eas-json/),
[iOS Simulator builds](https://docs.expo.dev/build-reference/simulators/), and
[custom schemes](https://docs.expo.dev/linking/into-your-app/).

## Scope and required environment

Required evidence includes the POS backend at the reviewed contract, PostgreSQL, Redis, a
backend-owned email provider with verified sender configuration, disposable test mailboxes, a
reachable API origin, `AUTH_PASSWORD_RESET_URL`, installed iOS and Android development builds, and
authorized access to sanitized backend diagnostics by safe request ID. Use simulators/emulators for
repeatability and physical devices for email-link and network behavior. Automated tests do not
replace founder acceptance.

The backend repository is authoritative for startup and service configuration. Follow its README
and deployment documentation; do not copy commands into this repository when they may drift. Verify
its `/health` endpoint using an approved origin, and confirm PostgreSQL/Redis/email readiness through
backend-approved diagnostics. Never print environment values.

## Founder-controlled development-build setup

1. Confirm authorization for the intended Expo/EAS account and linked project. Do not run
   `eas init`; the repository already contains an owner and project ID.
2. Confirm active Apple Developer membership before physical iOS work and choose the approved
   Android internal-testing method.
3. From a clean checkout run `npm ci`, `npm run auth:readiness`, and `npm run config:public`.
4. When authorized, validate profiles with
   `npx eas-cli@21.7.0 config --platform ios --profile development-simulator` and the corresponding
   `development` profile. This is configuration inspection, not a build.
5. Later, create the iOS Simulator development build with
   `npx eas-cli@21.7.0 build --platform ios --profile development-simulator`.
6. Later, register an authorized iOS device using the founder-approved EAS device workflow, then run
   `npx eas-cli@21.7.0 build --platform ios --profile development`.
7. Later, create an Android internal development build with
   `npx eas-cli@21.7.0 build --platform android --profile development`.
8. Download and install only artifacts associated with the reviewed project/build. Record the build
   identifier, never signing credentials or device identifiers.
9. Supply `EXPO_PUBLIC_API_BASE_URL` through the approved development environment, then run
   `npm run start:dev-client` and open the installed client.
10. Open React Native DevTools and the supported Network inspector. Confirm only the intended public
    API origin; do not capture credentials or payloads.

These commands are for later founder execution. They were not executed by this milestone.

## API reachability

- iOS Simulator can reach a backend on the Mac using the validator-approved loopback origin.
- Android Emulator uses `10.0.2.2` for the host computer; the existing validator permits this only
  in development.
- On a physical phone, `127.0.0.1` is the phone, not the developer's Mac. Use an approved reachable
  HTTPS development endpoint. Do not commit a LAN address or tunnel URL and do not add broad
  cleartext/ATS exceptions.
- Staging and production remain HTTPS-only. `EXPO_PUBLIC_API_BASE_URL` is public bundle
  configuration and must never contain credentials.

## Reset-link acceptance

The registered development shape is `pos://reset-password?token=<opaque-token>`.
`reset-password` is the host. Test it only in an installed POS development build; Expo Go is not
evidence for the `pos` scheme. For cold start, fully terminate the installed app and open the real
test email link. For warm state, leave the installed app running and open a newly issued link. Never
paste a real link into a terminal, issue, screenshot, or shared notes. Confirm the app replaces it
with the token-free route `/(auth)/reset-password`. Current Expo development-client documentation
notes limitations around cold-launch app-specific links; acceptance must record the observed build
and platform behavior rather than assuming it.

## Test-data and inspection rules

Use dedicated disposable accounts, never banking/health/production identities or a reused personal
password. Cover sensitive content in screenshots. Never paste passwords, codes, flow/reset tokens,
access/refresh tokens, cookies, Authorization headers, provider keys, or full reset URLs into issues.
Clear Network-inspector data after testing.

Filter network inspection by endpoint path and record only method, status, and safe request ID.
Debugger visibility is not application logging. Backend operators may correlate a safe request ID
against sanitized logs but must never enable request-body or credential logging.

## Fifteen-gate execution matrix

For every row record: platform/build, prerequisite, steps, mobile result, safe backend evidence,
email/provider evidence when applicable, PASS/FAIL, safe request ID, issue ID, and secret-free notes.

| Test    | Required execution and expected behavior                                                                                                            |
| ------- | --------------------------------------------------------------------------------------------------------------------------------------------------- |
| Gate 1  | Register a disposable address; expect neutral valid account-creation continuation. Cover duplicate/invalid cases without enumeration.               |
| Gate 2  | Confirm a real backend-owned verification email arrives; provider acceptance alone is not inbox delivery.                                           |
| Gate 3  | Enter the current code; expect verification success without automatic session creation.                                                             |
| Gate 4  | Exercise incorrect and expired codes; expect safe errors and no fabricated success.                                                                 |
| Gate 5  | Observe cooldown, explicitly resend, receive a new valid code, and confirm superseded state is unusable.                                            |
| Gate 6  | Sign in after verification; expect authenticated navigation and validated session facts.                                                            |
| Gate 7  | Sign in with a valid unverified account; expect the typed verification continuation.                                                                |
| Gate 8  | Request password recovery for eligible and unknown addresses; expect identical neutral UI and real eligible delivery.                               |
| Gate 9  | Open valid, invalid, expired, and replayed links from cold and warm states; expect secure token-free routing.                                       |
| Gate 10 | Submit a contract-valid new password; expect success and no automatic sign-in.                                                                      |
| Gate 11 | Confirm old-password rejection and new-password sign-in.                                                                                            |
| Gate 12 | Verify restoration, refresh, current-device sign-out, and exposed all-device sign-out behavior without stale-session restoration.                   |
| Gate 13 | Test offline registration/sign-in/verification/resend/recovery/reset, reconnect without replay, explicit retry, rate limit, and dependency failure. |
| Gate 14 | Inspect mobile/backend diagnostics; expect no secrets, bodies, credential URLs, or tokens in logs.                                                  |
| Gate 15 | Repeat the complete flow and required failure cases on iOS and Android development builds.                                                          |

Also record session restoration after relaunch, resend cooldown timing, malformed-response safety via
an approved controlled environment, and whether all-device sign-out is exposed in the acceptance UI.

## Issue ledger

Keep sequential identifiers beginning with `AUTH-01`. Do not pre-populate defects. Track ID, short
title, severity, blocking YES/NO, owner (`frontend`, `backend`, `infrastructure`, `governance`),
platform/build, safe request ID, status, retest result, and commit/PR only after a fix exists. One
acceptance-findings branch may group coherent frontend findings; backend defects require separate
handoffs and branches.

Use exactly this issue body:

```text
AUTH-XX — Short title
Platform:
Build:
Environment:
Screen/operation:
Prerequisite:
Steps to reproduce:
Expected:
Actual:
HTTP method/path:
HTTP status:
Safe request ID:
Frequency:
Screenshot/video with secrets covered:
Security impact:
Blocking: YES / NO
```

Failure ownership: frontend issue → `pos-mobile` fix branch; backend issue → backend handoff and
separate `pos-backend` branch; infrastructure issue → environment/release task; legal/policy issue →
governance/legal workstream. Never mix repositories in one fix branch.

## Immediate stop conditions

Stop for credential/token exposure, enumeration leakage, a wrong-user session, protected content
while signed out, reset credentials in navigation/logs, refresh replay weakness, production-service
usage, destructive database behavior, or cross-account data exposure. Preserve only sanitized
evidence and escalate to the correct owner.

## Completion report

```text
Authentication gates passed: __ / 15
Authentication gates failed: __ / 15
iOS result: PASS / FAIL / NOT RUN
Android result: PASS / FAIL / NOT RUN
Unresolved issues:
Security blockers:
Staging readiness: YES / NO
Founder approval: APPROVED / NOT APPROVED
```

## Staging boundary

This milestone does not deploy to staging. Before staging: complete development acceptance; fix and
retest every blocking AUTH issue; approve backend deployment; provision staging PostgreSQL, Redis,
email provider and verified sender/domain; supply an HTTPS API origin and approved reset HTTPS
domain; publish Apple AASA and Android `assetlinks.json`; configure approved legal URLs when consent
is active; configure staging EAS public environment values; create iOS/Android staging builds; and
obtain founder staging approval. None of these prerequisites is claimed to exist here.
