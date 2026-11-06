# Physical iPhone Release compatibility

## Scope and migration

POS-MOBILE-058 migrates the approved develop baseline
`4957a804e33fcc171ed2fcee7e581634b2c5d08a` through SDK 55.0.31,
56.0.23, and 57.0.27 on `chore/ios27-expo57-compat`.
This is dependency/configuration compatibility work. No native project,
build, device installation, signing changes, or backend deployment is included.

Official references:

- [Incremental SDK upgrades](https://docs.expo.dev/workflow/upgrading-expo-sdk-walkthrough/)
- [SDK 55 changes](https://expo.dev/changelog/sdk-55)
- [SDK 56 changes](https://expo.dev/changelog/sdk-56)
- [SDK 57 changes](https://expo.dev/changelog/sdk-57)
- [Official iOS scene lifecycle](https://github.com/expo/fyi/blob/main/ios-scene-lifecycle.md)
- [Router import migration](https://docs.expo.dev/router/migrate/sdk-55-to-56/)

SDK 55 requires the New Architecture and React 19.2. SDK 56 changes
Router's navigation imports, installs Expo fetch globally, and raises the
minimum iOS version to 16.4. SDK 57 moves to React Native 0.86 and newer
Reanimated/Worklets. The selected patch includes the official scene backport
and follows the Hermes regression fixes documented by Expo.

Retain TypeScript 5.9.3 using the documented `expo.install.exclude` option:
openapi-typescript 7.13.0 requires TypeScript 5 and typescript-eslint 8.46.4
requires TypeScript below 6. This is a compiler-version choice; typecheck and
lint remain mandatory. NativeWind 4.2.6, Tailwind 3, existing Babel/Metro
integration, design tokens and motion behavior are preserved.

## Scene configuration and identity

Configure `expo-build-properties` with `ios.enableSceneSupport: true`.
The official SDK 57 plugin requires Expo 57.0.23 or newer and updates the
native template during a future prebuild. It uses Expo's built-in scene
runtime. Do not add a custom SceneDelegate or SDK 54 lifecycle backport.
Inspect the generated AppDelegate and scene manifest before any future build.

Preserve POS, `com.personaloperatingsystem.mobile`, the `pos` scheme,
branding, version/build number, fingerprint policy and disabled updates.

## Separately authorized future device workflow

The commands below are instructions for a future task, not validation
performed by POS-MOBILE-058. They generate native files and install an app.
Use an isolated checkout with dependencies from the reviewed lockfile.

1. Validate the selected Xcode 27 toolchain, package alignment and clean inputs.
2. Supply an approved HTTPS origin through ignored local configuration.
3. Generate iOS only after authorization:

   ```bash
   DEVELOPER_DIR=/Applications/Xcode.app/Contents/Developer \
     npx --no-install expo prebuild --platform ios
   ```

   Confirm generated project names and inspect native output. SDK 57 prebuild
   regenerates native directories by default; never use it over unreviewed
   native modifications. Decide generated-directory tracking before this step.

4. Founder opens the generated workspace in Xcode, selects Personal Team and
   automatic signing, confirms the bundle identifier, and approves account,
   device pairing, Developer Mode and trust prompts.
5. Build/install Release only after authorization:

   ```bash
   DEVELOPER_DIR=/Applications/Xcode.app/Contents/Developer \
     npx --no-install expo run:ios --configuration Release --device --no-bundler
   ```

   Choose the physical iPhone. Verify the bundle build phase embeds JavaScript
   and assets and that no environment override sets `SKIP_BUNDLING`.
   Release is a compiler configuration; development signing with a Personal
   Team is separate. Debug/development-client startup is not the acceptance
   target. Expo Go, EAS builds and TestFlight are unnecessary for this path.

## Physical acceptance gates

- Direct home-screen cold launch with Metro stopped and debugger detached.
- Cold launch with the Mac powered off; airplane-mode startup renders bundled
  assets and safe network-unavailable behavior.
- Cold and warm password-reset links deliver exactly once to the existing
  centralized ingress; malformed links remain rejected.
- Registration/verification, sign-in, SecureStore refresh restoration,
  foreground/background transitions and sign-out preserve existing behavior.
- Incomplete/completed onboarding navigation and sequence remain correct.
- Today loading/empty/error/refresh states, create/edit/complete and persisted
  results remain correct; duplicate submissions remain suppressed.
- Date/time picker cancellation, timezone fidelity, modal dismissal guard,
  keyboard, visible save actions and safe areas work on the phone.
- Reanimated entrance/motion/reduced-motion behavior, light/dark appearance,
  NativeWind styling and accessibility remain correct.
- HTTPS authentication and Today operations succeed over cellular away from
  home with the Mac off. Verify fetch timeouts, cancellation and redirect
  rejection against the actual native transport.

Local automated checks cannot prove any native gate above.

## Backend and signing prerequisites

No reachable remote POS HTTPS environment is established by repository
configuration. Existing HTTP loopback configuration is rejected in Release
and cannot reach the Mac from a phone. Use an independently approved,
always-on HTTPS test backend and synthetic accounts/data. No backend change,
public tunnel, deployment or relaxed transport policy belongs in this task.
Offline startup does not establish offline authentication or mutations.

[Apple Personal Team guidance](https://developer.apple.com/help/account/basics/about-your-developer-account)
documents seven-day provisioning and periodic rebuild/reinstallation, up to
10 App IDs, three devices and three installed apps per device. Founder signing
and renewal require Xcode/Mac access. Keep identity stable and verify data and
session continuity after reinstall; do not uninstall to renew as a default.
Do not add push, associated domains, iCloud or Sign in with Apple capabilities
without a separate eligibility and scope review. Ordinary SecureStore custody
must be tested on the installed app.

## Rollback

Keep develop at the approved baseline until review. Preserve the migration
branch and evidence if validation fails. A separately approved rollback can
restore only the migration files from the baseline and reinstall dependencies
from its lockfile. Do not reset unrelated work, remove POS data, delete
simulators or overwrite backups. SDK 54 node_modules and package-lock were
preserved under `/private/tmp/pos-mobile-058-sdk54-*` during installation;
temporary backups are supplementary and are not durable release artifacts.

## Compatibility edits

- Repoint the plan-form removal guard to `expo-router/react-navigation` and
  tab-bar types to `expo-router/js-tabs`, with matching test imports. The guard
  behavior and routes are unchanged; unused external navigation packages are
  removed as required by the official Router migration.
- Preserve nullable/absent system appearance input in the theme resolver type
  after React Native narrowed ColorSchemeName; the light fallback is unchanged.
- Replace the removed StyleSheet.absoluteFillObject with absoluteFill in code
  entry. The input overlay layout is unchanged.
- Use Worklets' supplied mock in Jest setup and align React renderer/types and
  React Native's separate Jest preset. Existing product assertions remain.
- Move the removed top-level splash field to expo-splash-screen 57.0.9, retaining
  the exact image, background and contain mode. The official iOS legacy-layout
  option preserves the legacy layout intent; actual native appearance remains
  a Release-device acceptance gate. Brand checks now validate the plugin values.
- Pin direct package versions. Non-migration package versions remain at their
  installed baseline values, preventing unrelated upgrades during resolution.

## Validation record

Final SDK 57 local checks completed on October 8, 2026 (America/New_York).

| Command                                                                                                          | Result                                                              |
| ---------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------- |
| `npm run typecheck`                                                                                              | PASS                                                                |
| `npm run lint`                                                                                                   | PASS                                                                |
| `npm run format:check`                                                                                           | FAIL: five unchanged historical QA files                            |
| `npm test -- --runInBand --coverage=false`                                                                       | PASS: 60 suites, 436 tests                                          |
| `npm run api:check`                                                                                              | PASS: generated contract types current                              |
| `npx --no-install expo install --check`                                                                          | PASS; online metadata checked; documented TypeScript opt-out        |
| `npm run doctor`                                                                                                 | PASS: 20/20 checks                                                  |
| `npm run config:public`                                                                                          | PASS                                                                |
| `npm run brand:validate`                                                                                         | PASS                                                                |
| `npm run auth:readiness`                                                                                         | PASS: repository prerequisites only                                 |
| `npm ls --all`                                                                                                   | PASS: final dependency tree                                         |
| `npm ci --dry-run --ignore-scripts --offline --cache /private/tmp/pos-mobile-058-npm-cache --no-audit --no-fund` | PASS: lockfile consistency; no installation performed by this check |
| `git diff --check`                                                                                               | PASS                                                                |

SDK 55 and SDK 56 each passed TypeScript and all 436 existing tests before
moving to the next SDK. Initial sandbox DNS failures were resolved through
approved network execution. A transient process-spawn EAGAIN failure was
resolved by retry. Interrupted installs were repaired with preserved backups
and clean resolution; the final tree and lockfile checks pass.

The five format failures are evidence-index.md, execution-matrix.md, report.md,
evidence/backend-health.json and evidence/runtime-openapi.json under
qa-output/today-acceptance-2026-10-06. Their bytes match the approved baseline;
Prettier also fails on extracted baseline copies. They were left untouched.
Changed migration files pass targeted formatting validation. Jest retains
React act warnings; they are not suppressed or treated as native evidence.

Implementation status: COMPLETE for the authorized migration and local checks.
Ready for founder review: YES. Ready for Git step: NO until the pre-existing
repository format failures are reviewed or handled in separately approved scope.
No staging, commit, push, PR or promotion was performed.

Native build/device validation: NOT PERFORMED. No ios/ or android/ was generated.

## Exact dependency changes

| Package                                  | Installed baseline | Migration pin                        |
| ---------------------------------------- | ------------------ | ------------------------------------ |
| `@react-native-community/datetimepicker` | 8.4.4              | 9.1.0                                |
| `@react-native-community/netinfo`        | 11.4.1             | 12.0.1                               |
| `expo`                                   | 54.0.37            | 57.0.27                              |
| `expo-build-properties`                  | Not present        | 57.0.22                              |
| `expo-constants`                         | 18.0.14            | 57.0.21                              |
| `expo-dev-client`                        | 6.0.21             | 57.0.19                              |
| `expo-font`                              | 14.0.12            | 57.0.4                               |
| `expo-haptics`                           | 15.0.8             | 57.0.3                               |
| `expo-linking`                           | 8.0.12             | 57.0.12                              |
| `expo-router`                            | 6.0.24             | 57.0.25                              |
| `expo-secure-store`                      | 15.0.8             | 57.0.4                               |
| `expo-splash-screen`                     | Not present        | 57.0.9                               |
| `expo-status-bar`                        | 3.0.9              | 57.0.1                               |
| `react`                                  | 19.1.0             | 19.2.3                               |
| `react-dom`                              | 19.1.0             | 19.2.3                               |
| `react-native`                           | 0.81.5             | 0.86.3                               |
| `react-native-gesture-handler`           | 2.28.0             | 2.32.0                               |
| `react-native-reanimated`                | 4.1.7              | 4.5.1                                |
| `react-native-safe-area-context`         | 5.6.2              | 5.7.0                                |
| `react-native-screens`                   | 4.16.0             | 4.26.0                               |
| `react-native-svg`                       | 15.12.1            | 15.15.4                              |
| `react-native-worklets`                  | 0.5.1              | 0.10.1                               |
| `@react-native/jest-preset`              | Not present        | 0.86.3                               |
| `@types/react`                           | 19.1.17            | 19.2.18                              |
| `babel-preset-expo`                      | 54.0.12            | 57.0.14                              |
| `jest-expo`                              | 54.0.18            | 57.0.5                               |
| `react-test-renderer`                    | 19.1.0             | 19.2.3                               |
| `@react-navigation/bottom-tabs`          | 7.18.14            | Removed; Router owns navigation APIs |
| `@react-navigation/native`               | 7.3.14             | Removed; Router owns navigation APIs |
| `@react-navigation/native-stack`         | 7.18.6             | Removed; Router owns navigation APIs |
