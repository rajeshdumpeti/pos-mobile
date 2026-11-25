# Voice entry (VOICE-M4)

Add one task by speaking. Speech becomes text on the iPhone (VOICE-M1), a local rule-based
parser builds one proposal (VOICE-M2, `docs/voice/parser-spec.md`), the person reviews and edits it
on a card, and Add saves it through the existing create path. Audio, words and the card exist in
memory only. They are never stored, logged or sent anywhere except the finished task.

## When the mic is shown

`useVoiceAvailability()` is enabled only when ALL of these are true:

1. `EXPO_PUBLIC_VOICE_ENABLED` is exactly the string `true` (build flag, default off).
2. `GET /api/v1/features` returned `voice_entry.enabled: true` for the signed-in account
   (backend VOICE-M3). The request is refetched when the app returns to the foreground and
   whenever Today is refetched. Any error or unknown shape means voice is off (fail closed).
3. The platform is iOS.
4. The native module reports `available` or `permission_undetermined` (first use asks).

Development builds expose a reason code (`build_flag_off`, `server_flag_off`, `checking`,
`native_<status>`, `unsupported_platform`); release builds never do. Outside the provider there is
no mic at all.

Entry points: an icon next to **Add plan item** on Today and on Plan, and a labelled **Add by
voice** second option on Quick Log. All three open one shared sheet.

## Session states

`idle → consent → requesting_permission → listening → parsing → review ⇄ clarifying → saving →
unknown_outcome → done | failed | discarded` (`src/features/voice/session`).

- **consent**: shown before any OS prompt, first use only. Only the fact that it was seen is
  remembered, as a boolean in AsyncStorage (`@pos/voice-explainer-seen`).
- **listening**: 30 s maximum, live words, countdown ring, Stop and Cancel. With VoiceOver on,
  listening starts after the opening announcement finishes. Haptics mark start and stop.
- Ending with `interrupted`, `backgrounded` or `error` delivers no text and writes nothing.
  `cancelled` discards everything.
- **review/clarifying**: the card edits a normal `PlanDraft`, so `serializeDraft` validates it
  exactly like the manual form. Add stays disabled until every clarification is resolved. A time
  that does not exist or occurs twice (clock changes) is never guessed.
- **saving**: the card locks. Add is sent once (a coordinator separate from the manual form's),
  the idempotency key is created when Add is tapped, and every replay reuses the same key and
  body. Entry source `voice` and an 8 s timeout are sent.
- **unknown_outcome**: after the automatic replays (1 s, 3 s, 9 s) fail ambiguously. A new voice
  session is blocked until Try again succeeds or fails definitively.
- Errors: `401` discards and hands over to the session-expired flow; `403` discards with the
  existing message; `409` idempotency conflict is a generic error, never a new key; `422` goes
  back to the card; offline keeps the card and sends nothing.

## Privacy and purging

- Memory only: no AsyncStorage, SecureStore, query persistence, navigation params or logs hold
  words or card values.
- The card is discarded after 10 minutes without interaction, after 5 minutes in the background,
  and on app kill (nothing persisted).
- Sign-out, session expiry and account change unmount the provider, which cancels the
  microphone, forgets the card and any pending save, and clears the "Type it instead" handoff.
  A result that arrives for another account is ignored.
- **Type it instead** opens the normal create form with what was understood, through a one-shot
  in-memory handoff (`prefill.ts`), cleared on read, not route params.

## Not included

Android, analytics, a global header mic, editing or completing by voice, and highlighting the new
item in the list (the lists have no highlight support yet, so the toast's **View** opens the item).
