# Authentication UI foundation — 1.C.1

## Boundary and evidence

The root navigation policy redirects signed-out access to Welcome in `app/(auth)/`. Routes are thin compositions of
`src/features/auth/screens`; components own reusable fields, artwork framing,
actions, and local presentation. Root providers, appearance persistence, React
Query infrastructure, and the temporary `FoundationScreen` remain intact. The
temporary screen is no longer the app entry.

Both supplied UX boards were reviewed: primary Authentication screens and
Authentication states/sheets/microinteractions. Their composition, violet identity,
spacing and quiet motion inform the UI. Excluded controls, legal text, example
identities, obsolete password rules and success-to-product navigation were omitted.
The boards are not shipped as assets.

Read-only backend reference: `origin/develop`
`c2f2ddeb20e03fca32062119fb59845892a46224`. Reviewed the consolidated
`docs/frontend-authentication-handoff.md`, historical registration/session/security/
recovery handoffs, and locally generated OpenAPI from `create_app(load_settings({}))`.
The authoritative contract is v1.1.0 (`x-pos-authentication-contract-version`).
Sign-in contains only email/password; registration policy supplies legal versions;
reset requests return `instructions_if_eligible`; reset confirmation returns 204
and creates no session. Historical handoffs are superseded where they differ.
No service was started or called, and no backend file was modified.

## Public routes

| Path                 | Presentation and working interaction                                                |
| -------------------- | ----------------------------------------------------------------------------------- |
| `/welcome`           | Original hero, email entry to Sign In, Create Account                               |
| `/create-account`    | Name/email/password/confirmation editing, visibility, Sign In                       |
| `/sign-in`           | Email/password editing, visibility, Create Account, Forgot Password                 |
| `/verify-email`      | One native six-digit input with six decorative cells; paste/deletion/leading zeroes |
| `/forgot-password`   | Native modal route, reusable email content, Close/back                              |
| `/reset-link-sent`   | Conditional, privacy-safe reset instructions; return to Sign In                     |
| `/reset-password`    | Editable passwords and a local length guide, not a security score                   |
| `/password-updated`  | Success presentation and return to Sign In                                          |
| `/offline`           | Recoverable explanation, unavailable retry, Back                                    |
| `/too-many-attempts` | Temporary retry period; `— : —` when timing is absent                               |
| `/security-state`    | Generic, non-revealing error; unavailable retry, Back                               |

Registration navigates to verification only after an authoritative pending-verification
response. Verification, resend, and pre-verification email changes are connected through
the typed integration boundary; other outcome routes remain gated by their real outcomes.
There are no fake requests, successes, timers, or loading delays. `AuthAction` reuses the
shared loading/busy visual boundary.

## Visual, motion, and accessibility decisions

Semantic theme tokens supply all colors, spacing, type, radii and motion durations.
`IllustrationFrame` selects the six original 1.C.0 assets through the central registry;
artwork is decorative because nearby headings provide its meaning. The transparent
artwork carries the atmospheric glow. Reading width is capped on tablets and artwork
shrinks on narrow screens. Forms and footers scroll together at large text sizes.
Password visibility uses two names added to the existing POSIcon map.

Reanimated provides short non-looping content/artwork fades, including success.
Its synchronous reduced-motion preference controls first mount; native preference
subscriptions follow changes and suppress subsequent route transitions. Shared
buttons provide token-based press feedback and accessible busy/disabled semantics.
Shared fields retain visible focus rings; trailing controls reserve input space.
The keyboard-safe Screen avoids double iOS keyboard adjustment by letting
KeyboardAvoidingView own padding; Android keeps native resize behavior.

Authentication actions select shared Button variants without owning their size, colors, borders,
opacity, or interaction states. Button resolves those properties centrally from the hydrated theme and
passes a concrete style array to the native Pressable. NativeWind remains available for stable screen
layout; it does not compete for state-critical control properties. Semantic `controlSizes` roles own
button, input, icon-button, and minimum touch dimensions.

Headings use header semantics. Text scales without fixed text container heights.
Authentication controls and fields have at least 48-point targets. The code input
is one accessible native field; its six visual cells are hidden to avoid duplicate
announcements and expand vertically with font scale. No code completion triggers
validation. Password switches announce checked state and show/hide hints. Back/Close
uses native router history, with a Welcome fallback when mounted without history.
No custom hardware-back or swipe interception is added.

## Dependencies and deferred work

No dependency added; manifest and lockfile are unchanged. Existing SDK-compatible
Reanimated/Gesture Handler and the illustration glow meet this milestone without
expo-linear-gradient or expo-haptics. No new Expo Go compatibility requirement.

Email/password only: Apple, Google, Remember Me, biometrics, MFA, passkeys, account
linking, account-lock/permission-denied UI, Quick Access, Contact Support, and the
five-step progress UI remain excluded.

Legal presentation is driven only by the server policy. Deferred mode renders no legal
controls or legal request fields. Required mode presents independent Terms and Privacy
acceptance controls and sends the exact server versions after both are accepted.
Password length remains local feedback only; server validation is authoritative.

Sign-in, password recovery, session restoration/refresh/logout, and session secure storage
remain later milestones. Registration verification state is memory-only and is cleared at
terminal boundaries.
Navigation 1.D now validates the backend-authorized opaque reset `token` at the route boundary
without exposing it to presentation or calling an API. See
[Navigation foundation](navigation-architecture.md). Appearance storage remains existing theme
infrastructure.

## Manual verification

Automated component tests cover every public route in light/dark mode, approved
navigation, disabled submissions, code editing, visibility, keyboard scaffold,
conditional reset copy, recovery, local progress and reduced-motion updates.
An AST boundary test checks Authentication source for forbidden dependencies/calls.
These checks do not replace native visual or assistive-technology verification.

On iOS and Android, review all routes at narrow and large phone sizes, light/dark/
system appearance, maximum Dynamic Type, keyboard open, VoiceOver/TalkBack, and
Reduce Motion. Check modal dismissal, iOS back swipe, Android hardware Back, focus
visibility, pasted codes, password toggles, footer reachability, and loading visuals.
Confirm unavailable actions never claim an outcome and exercise both registration-policy modes.

## Milestone 1.E state integration

The approved screens now use the ownership and privacy boundaries in [authentication-state.md](authentication-state.md). React Hook Form owns local interaction state, Zod owns immediate client feedback, and operation-specific submission intents are inert until a future controller is supplied. No screen creates a backend outcome or changes session state.
