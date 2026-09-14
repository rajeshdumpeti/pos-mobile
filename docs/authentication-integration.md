# Secure Authentication integration foundation (1.G.1)

The credential path is `backend result → future controller → credential vault → access credential in memory / refresh credential in Expo SecureStore → token-free session → navigation access`. Tokens stay opaque; the app does not decode JWTs or treat local parsing as authorization.

`com.pos.auth.refresh.v1` stores a version-1 JSON envelope containing only the refresh credential. The complete versioned JSON envelope is rejected when its UTF-8 encoding exceeds SecureStore’s 2,048-byte bound. The adapter uses `WHEN_UNLOCKED_THIS_DEVICE_ONLY` and `requireAuthentication: false`: iOS uses Keychain and Android uses Keystore through Expo SecureStore, so credentials are available only while the device is unlocked and do not migrate through backup, with no biometric prompt, AsyncStorage, plaintext, web, or memory persistence fallback. Locked-device access is intentionally prohibited because POS has no approved background Authentication requirement. Expo Go supports this non-biometric usage; development builds and releases use the installed native module. Unsupported platforms fail closed.

The vault owns a private closure-scoped access credential. Commit and rotation validate both opaque values, persist refresh first, and expose access only after persistence succeeds. Failed persistence clears candidate memory access. Clear removes memory access first and then attempts secure deletion; presentation must remain signed out even if deletion fails. SecureStore cannot provide database transactions, so this ordering provides a fail-closed application guarantee rather than atomic native storage.

Stored refresh presence means only “requires authoritative validation.” `inspectSessionBootstrap` always completes signed out in 1.G.1 and distinguishes missing, unavailable, failed, malformed, and awaiting-validation records. It neither calls refresh/current-session nor trusts stored data. The stored valid record is retained for 1.G.3 validation; malformed data is never exposed. Production continues to start signed out with no protected-content flash.

`AuthenticationIntegrationProvider` composes application-scoped transport, typed service, vault, bootstrap inspection, error mapping, and query policy once. Its public capabilities do not expose storage, tokens, or service responses. API errors map at the feature integration boundary into fixed Authentication failures; safe request IDs and retry metadata survive, while bodies and unknown data do not.

Authentication mutation keys are centralized and contain operation names only. The policy is `retry: false`, `networkMode: always`, and `gcTime: 0`. Authentication submissions are immediate explicit user intents. If offline, they fail safely and require a new user action. They are never queued for reconnect replay. Future controllers must transfer success credentials directly into the vault and immediately reset sensitive mutation state. Authentication mutation state is not persisted or dehydrated.

Milestone 1.G.2 connects registration policy, registration, verification, resend,
and unverified-email change through the private transient workflow in
[the 1.G.2 handoff](auth-registration-verification.md). Later milestones connect
sign-in, restoration/refresh, sign-out, and password recovery. Real-backend
completion gates remain subject to founder validation.
