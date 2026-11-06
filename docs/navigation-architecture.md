# Navigation architecture — authenticated shell

Expo Router owns native stacks, tabs, history, URL entry and unknown-route recovery.
`src/navigation` remains the shared destination catalog, access policy and safe back/dismiss
boundary. Features do not implement separate restoration or redirect rules.

## Authenticated shell

The protected native Stack contains `(tabs)`, Notifications/Profile modal panels and a regular
Quick Log screen. Its default destination is Today, replacing the temporary Foundation screen. Four real
Expo Router tabs appear in order Today, Plan, Focus, Review. The custom native bar inserts a
violet Add action between Plan and Focus; it is never a selected tab. Selected tabs have a labeled
violet pill using the darker `accentSelected` token and accessibility selected state. The fixed-size
Add button has a contrasting 28-point plus icon. Normal navigator layout and bottom safe-area padding
prevent overlap. Light/dark/system semantic theme tokens and scalable text are reused. Shell stack
transitions disable native animation. Notifications/Profile use rounded, safe-area-inset side
panels capped at 84% of window width (420 points on larger screens). A full-screen themed dimmed
backdrop leaves outside space to tap and dismiss. Panels enter from the right and close back to
the right using the same eased 440ms transition. Navigation dismissal waits for the close animation
to finish; the backdrop fades with panel movement. Back, outside taps and Android hardware Back
share the close path. Existing Reanimated motion honors system reduced motion. Header surfaces
use a soft themed violet background. Repeated dismissal taps are guarded.

The shared header shows each title, or Today's local greeting, authoritative session display name
and local date. The bell opens Notifications; the initials avatar opens Profile, with POS as the
neutral fallback. No Search, unread badge, upload or image service is implemented. Header/Add
navigation uses `navigate` plus a focus-reset opening guard to suppress duplicate taps.

Profile/Notifications use a left Back control and centered title in one header row. Back dismisses
modal history or returns to Today after cold entry, without misleading tab selection. Quick Log is
not a modal: its Back action uses native history, preserving the underlying tab, or falls back to
Today. Profile retains the real session logout operation with a busy guard, safe failure
message and query-cache clearing. Successful logout returns to Authentication through the existing
session boundary, not a feature-owned redirect.

Bodies deliberately contain only:

- Today: “Your Today content goes here.”
- Plan: “Your plan goes here.”
- Focus: “Your focus content goes here.”
- Review: “Your review goes here.”
- Notifications: “Your notifications go here.”
- Profile: “Your profile content goes here.”
- Quick Log: “Your quick logging actions go here.”

No metrics, AI, logging forms, fake saves, APIs or dependencies are added. No private values are
added to parameters, query keys, analytics or logs.

## Access and entry

`SessionNavigationAccess` derives access from the existing token-free session state:

- `checking`: neutral restoration loading, with no protected-content flash.
- `signedOut`: Authentication Welcome.
- `onboarding`: Onboarding, including direct attempts to open any shell route.
- `signedIn`: Today, requiring authoritative `onboardingRequired=false`.

Completed sign-in, cold restoration and session-confirmed onboarding completion enter the same
`/(app)/(tabs)` destination, resolving to Today and matching generated typed routes. Authentication and Onboarding never mount shell UI.
See [authentication-state.md](authentication-state.md) for session ownership. Route guards improve
UI flow but do not replace backend authorization.

## Back, recovery and deep links

Existing Authentication native-stack/modal behavior is unchanged. Welcome has no Back control;
other routes use established safe-history fallbacks. Forgot Password remains a native modal.
Recovery routes remain available to signed-in users where existing policy permits them.
Unknown-route recovery uses allow-listed destinations without echoing URLs.

The app owns the `pos` scheme for local Router testing. Universal links and platform domain
associations remain deferred. Reset continuation retains the existing transient-memory ingress
and custody boundary; navigation does not render, log or persist tokens. Arbitrary redirect
parameters are ignored. URLs never prove identity, verification or authorization.

## Validation boundary

Automated component/policy/session tests and iOS/Android JavaScript exports do not replace
founder device testing of visual fidelity, font scaling, safe areas, gestures and screen readers.
