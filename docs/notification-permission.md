# UX-NTF-02 — Notification permission

Screen 1 implementation on `feat/notification-permission`, based on clean `3cb4a5121269de6770a6730ec25a206622c9e686`. The founder-approved written handoff controls the two benefit rows and truthful permission-only success copy. The showcase is a composition reference, not a bundled asset. Existing POS light/dark tokens, accessible text/buttons/cards, bell/calendar icons, safe-area screen and native modal conventions are reused. No decorative animation, gradients, inbox or new visual system is added. Native presentation follows the existing Reduce Motion setting. The content scrolls at narrow widths and large text sizes; the close control remains reachable.

## Architecture and entry

`app/(app)/notification-permission.tsx` is a separate protected modal. It preserves the existing Notifications panel, Today/Plan layouts, Authentication and Onboarding gates. No permanent entry button or startup/login/foreground presentation is added.

Future approved contextual Today/Plan actions can call `useNotificationPermission()` with the launching control's `RefObject<View | null>`. It records the real accessibility return target through the existing focus-return hook and uses the existing duplicate-safe Router destination helper. No route parameters, titles, reminder data, credentials or arbitrary redirect targets are used. Close, Not now, Continue and Android Back stop the controller immediately and return through native history, falling back to Today after cold entry. Swipe dismissal is disabled so dismissal follows a guarded path. Existing TODAY-01 transitionEnd autofocus and form flows are untouched.

The pure view owns presentation. A small memory-only controller owns checking/requesting/settings/error transitions, synchronous busy guards, lifecycle generations and queued status rechecks. A mounted hook checks permission on entry and on returning from background; neither action requests permission. Closing/unmounting invalidates late asynchronous results and removes the lifecycle listener. It cannot cancel an already displayed OS prompt, but ignores its late result.

Only explicit Enable reads current OS state and then requests if authorization is not already granted and the OS says another request is allowed. The default adapter shares concurrent native requests. iOS native authorization takes precedence over the generic granted boolean: provisional and ephemeral states show distinct limited-access copy, never full-success copy. Android uses native status/canAskAgain, including pre-runtime-permission OS behavior. No unsupported restriction cause is inferred. Denial stays nonblocking. Supported non-requestable states offer device settings; opening failure has safe recovery copy. Unknown checks fail safely with Check again. No raw errors are logged or displayed.

Granted copy confirms permission only, explains device settings, and provides Continue. Permission is separate from onboarding preferences, token registration and delivery readiness; no reminders are scheduled or promised after authorization.

## Dependency and native requirements

Before installation, declared, locked and installed Expo were independently confirmed as `57.0.30`; local `expo/bundledNativeModules.json` specified `expo-notifications ~57.0.23`. Following founder approval, installation used `npx expo install expo-notifications`, resolving `57.0.23`. Lockfile inspection confirmed no existing package changed version. Newly added transitive packages are `expo-application@57.0.3` and `badgin@1.2.3`. The previous SDK 54 baseline was not restored or upgraded.

The adapter deliberately imports the installed package's permission submodule and authorization enums, avoiding its root module's automatic push-token-registration side effect. This scoped import is covered by platform-adapter tests and both platform exports. Review it when changing the notifications package. No token APIs, scheduling, handlers, networking, storage, credentials or backend contracts are introduced. No custom notification config plugin, background mode or provider configuration was added to `app.json`; the native package supplies its standard platform integration.

**An existing development client must be rebuilt to include the new native module before native permission acceptance.** An old client reports a safe check failure; it must not fabricate success. No EAS build, prebuild, native project generation or native directories were performed/created in this task. Expo Go rendering is not acceptance for the POS development client's OS permissions.

## Founder iOS and Android acceptance

Use a newly built development client containing the approved package, the normal Metro workflow and an authenticated account with onboarding complete. Native builds remain a separate authorized step. Sign in normally and navigate to Today or a selected Plan date. There is intentionally no new permanent entry control.

For verification, open the protected route with the existing POS scheme:

```sh
# iOS simulator with the POS development client installed
xcrun simctl openurl booted 'pos://notification-permission'

# Android emulator/device with the POS development client installed
adb shell am start -W -a android.intent.action.VIEW -d 'pos://notification-permission' com.personaloperatingsystem.mobile
```

A cold/deep-link entry may have no prior native history and safely returns to Today. Verify contextual history/focus separately through the documented reusable opener when an approved caller is integrated; no speculative caller is shipped.

1. Confirm signed-out and onboarding users cannot mount the permission route. Ordinary app startup, login and Today/Plan visits must never prompt or open this experience.
2. With undetermined authorization, inspect light/dark, largest practical text, narrow widths, VoiceOver/TalkBack labels and reduced motion. Exactly two benefit rows are present. Close and Not now return without a native request.
3. Reopen, tap Enable rapidly and verify only the OS dialog appears once. Grant permission: truthful success, device-settings explanation and Continue return. Already-granted entry must not prompt again.
4. Deny and retry only when the OS permits it; test non-requestable denial and supported settings recovery. Return from settings after changing permission and verify a fresh check. Also check request/check failure and settings-opening failure safely.
5. Verify iOS provisional and ephemeral access using an appropriate test environment: limited access is never presented as full alert permission. On Android, cover current runtime-permission and older supported system-settings behavior. No restriction cause should be guessed.
6. Dismiss/background during a delayed check or request, then foreground. No dismissed screen should reopen or update; the OS prompt itself cannot be cancelled by POS. Verify previous Plan date/history and return focus through the contextual opener.
7. Confirm onboarding preferences, Today, Plan, item forms, account transitions and the existing Notifications panel are preserved. Granting permission must not register tokens, call a backend, schedule or deliver anything.

Real OS dialogs, rebuilt development-client operation, Android native behavior, screen readers and physical devices remain founder acceptance requirements. Automated tests and JavaScript exports do not establish those outcomes.

## Local validation and remaining acceptance

- Full Jest: **67 suites / 496 tests passed**. Coverage includes permission states, explicit-only requests, concurrent suppression, settings failures/return, stale results, lifecycle teardown, protected entry, contextual return and light/dark accessible composition. Today/Plan, Authentication, Onboarding, forms and navigation regressions passed.
- Typecheck, ESLint, formatting, generated API drift, authentication readiness, brand validation, public Expo configuration, iOS/Android JavaScript exports and `git diff --check` passed.
- `expo install --check`: dependencies up to date. Expo Doctor: **20/20 passed**.
- Existing React act warnings from asynchronous reduced-motion updates remain visible. Exports emitted existing NO_COLOR/FORCE_COLOR warnings. npm installation reported 80 audit advisories (20 moderate, 60 high); no unrelated audit fixes were applied.
- Attempted synthetic view-only Expo Go inspection in a temporary directory outside the repository. The simulator URL launch timed out, and manifest-asset requests were aborted; no rendered-screen or native-permission acceptance is claimed. The temporary harness is not shipped. Actual OS dialogs, device settings, contextual focus and native visuals remain unverified.

The authorized implementation and local checks are complete. **READY FOR FOUNDER MANUAL VERIFICATION: NO in the currently installed development client**; a separately authorized client rebuild is required for the added native module. After rebuilding, use the verification instructions above. No build is included in this task.

## Delivery Git state

All changes are unstaged. No commit, push, PR, merge, GitHub configuration, backend or deployment changes were performed. Exact `git status --porcelain=v1 --untracked-files=all`:

```text
 M app/(app)/_layout.tsx
 M package-lock.json
 M package.json
 M src/navigation/navigationPolicy.test.tsx
 M src/navigation/routes.ts
 M src/test/navigation-shell.test.tsx
?? app/(app)/notification-permission.tsx
?? docs/notification-permission.md
?? src/features/notification-permission/NotificationPermissionScreen.tsx
?? src/features/notification-permission/NotificationPermissionView.tsx
?? src/features/notification-permission/controller.test.ts
?? src/features/notification-permission/controller.ts
?? src/features/notification-permission/experience.test.tsx
?? src/features/notification-permission/platform.test.ts
?? src/features/notification-permission/platform.ts
?? src/features/notification-permission/presentation.test.tsx
?? src/features/notification-permission/presentation.ts
?? src/features/notification-permission/usePermission.ts
```
