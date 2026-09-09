# Navigation foundation — 1.D

## Ownership and route groups

Expo Router owns file routes, native stack presentation, platform history, URL entry, and unknown
route recovery. Public Authentication routes live in `app/(auth)`; the future protected
application boundary lives in `app/(app)`. Its index renders only the neutral temporary
`FoundationScreen`.

`src/navigation` is the small policy boundary between Router and features:

- `routes.ts` is the typed allow-list for programmatic destinations.
- `navigationPolicy.ts` contains pure entry, route-classification, recovery, and continuation
  decisions.
- `NavigationAccessProvider.tsx` exposes only `checking | signedOut | signedIn`.
- route boundaries prevent protected-content flashes and centralize redirects.
- `useSafeNavigation` uses native history when available and replaces with an allow-listed
  fallback after cold entry.

Feature screens request a destination from the catalog. They do not implement access policy,
session restoration, sensitive parameter parsing, or redirect rules.

## Access and entry policy

| Access state | Root entry                                                      |
| ------------ | --------------------------------------------------------------- |
| `checking`   | Accessible neutral restoration progress; no auth or app content |
| `signedOut`  | Replace with Authentication Welcome                             |
| `signedIn`   | Replace with the protected application index                    |

Production currently defaults to `signedOut`. The provider stores no token, account, session, or
mutation function. Milestone 1.E can supply restored access status without changing route files.
Tests may inject another status; the application exposes no sign-in toggle.

The protected layout renders nothing protected until access is `signedIn`. Signed-out direct
entry replaces with Welcome. A future signed-in user opening Welcome, Sign In, or Create Account is
redirected to the application index. Recovery routes remain available because the backend contract
does not authorize blocking a legitimate password-recovery continuation for a signed-in browser or
device.

## Back and modal behavior

Welcome is the Authentication root and has no back control. Create Account and Sign In use native
history and replace with Welcome when no usable history exists. Verify Email and Reset Password
fall back to Sign In when transient continuation history is unavailable. Forgot Password is
declared as a native modal in the Authentication stack; its Close action dismisses history and
replaces with Sign In after direct entry. `navigate` is used to avoid stacking duplicate Forgot
Password destinations. Native iOS gestures and Android Back remain enabled.

## Deep links and security

The app owns the `pos` custom scheme for local Router testing. Universal links, associated
domains, Android App Links, and the deployed reset base URL remain deferred until founder-owned
domain evidence exists.

Backend commit `b95173109eff21cac297ca274a2a704d5f663794`, Authentication Contract `1.0.0`,
defines the reset destination as a configured base URL with exactly one query parameter named
`token`. Navigation accepts one 32–256 character string, preserves it as opaque data, rejects
missing/repeated/unexpected values, and passes only continuation availability to presentation.
No token is rendered, logged, persisted, placed in global state, or treated as proof of success.
Email-verification URL parameters are not implemented because the contract defines verification
continuation as API-returned transient memory and provides no verification-link URL shape.

Navigation ignores arbitrary redirect parameters and only selects destinations from `routes.ts`.
Opening a URL never proves identity, verification, password-reset success, or authorization.
Protected APIs will still require backend-issued credentials. Route guards improve UI flow; they
do not replace backend authorization.

## Recovery and deferred integration

Unknown routes show an accessible generic message without echoing a possibly sensitive URL.
Recovery replaces with Welcome while signed out and the protected index while signed in.

Milestone 1.E will own secure session restoration and supply read-only access status. Authentication
API integration will own transient verification/reset material and confirmation calls. Secure
credentials must use a platform secure-storage abstraction outside navigation. No API call,
AsyncStorage token, session persistence, fake authenticated state, or product route is introduced
by 1.D.
