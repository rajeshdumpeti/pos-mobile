# CLAUDE.md — POS Mobile

Read this file fully before doing anything in this repository.

## What this is

POS (Personal Operating System) is a mobile-first daily planning app. This repo is the
Expo React Native app (iOS first; Android after its own QA). The backend lives in the separate
`pos-backend` repo. The founder (Razz) is the product owner and final approver of every change.

Authoritative documents, in order of precedence:

1. POS 02 Master PRD v1.0 (product baseline)
2. POS 03C Design System v1.0 and POS 03 UX specifications
3. POS 04 Core Technical Architecture v1.0
4. Approved feature PRDs (for example, Voice v1 PRD `POS-VOICE-PRD-001` v1.0)
5. Approved milestone specifications given to you in the prompt
6. Docs in `docs/` and the merged code + tests (evidence of what exists)

A recommendation, draft, mockup or design board is NOT an approval. Mockup controls that are not
in the approved spec are not requirements. If something is unclear or conflicts, stop and ask.

## How we work (mandatory)

Every piece of work is one milestone with an ID (for example `VOICE-M4`). The steps are:

1. **Spec**: the founder gives you an approved milestone prompt. Implement only that scope.
2. **Implement**: smallest change that satisfies the spec. No refactors, renames, formatting
   sweeps or unrelated fixes. Report real problems outside scope; do not fix them.
3. **Validate**: run every command in "Validation" below and fix failures you caused.
4. **Report**: finish with the Implementation & Validation Report (template at the end).
5. **Founder review**: report + diff are reviewed before any Git step.
6. **Manual testing**: the founder tests one gate at a time with YES/NO checks
   (untested = PARTIAL). Automated tests are supporting evidence, not acceptance.
7. **Git**: the founder runs all Git commands. You provide copy-paste commands only.

## Git rules

- Never run `git commit`, `git push`, `git merge`, `git rebase`, `git reset --hard`,
  `git stash drop`, `git checkout -- <file>`, branch deletion, or any force operation.
- Read-only Git is fine: `git status`, `git diff`, `git log`, `git show`, `git branch`.
- Branches from `develop`: `feat/<name>`, `fix/<name>`, `chore/<name>`.
  Flow: feature branch → `develop` → `staging` → `main`, by pull request, founder-approved.
- At the end, give the founder the exact commands in one code block (branch, `git add` of
  specific files, conventional commit message such as `feat(voice): add review card`, push).

## Never

- Never run EAS cloud builds, TestFlight/App Store submission, or OTA updates unless the
  milestone explicitly asks. Local dev-client builds are fine when the milestone needs them.
- Never add, upgrade or remove an npm dependency or Expo config plugin unless the milestone
  approves that exact package and version. Use `npx expo install` for Expo packages.
- Never put secrets in `EXPO_PUBLIC_*` variables (they ship in the app bundle).
- Never log, persist or send personal content (item titles, tokens, emails, speech).
- Never add analytics or crash-reporting SDKs (none is approved).
- Never hand-edit `src/api/generated/schema.ts`; regenerate it.
- Never run `npm run format` across the repo unless the milestone approves a formatting change.

## Stack

- Expo SDK 57, React Native 0.86, React 19, TypeScript (strict), Node 22.14 (`.nvmrc`), npm 11.
- Expo Router (route groups `(auth)`, `(onboarding)`, `(app)/(tabs)`: Today, Plan, Focus, Review).
- TanStack React Query (server state), React Hook Form + Zod (forms/validation), NativeWind.
- Jest + React Native Testing Library, ESLint, Prettier.
- Dev client required for native modules (`npm run start:dev-client`); Expo Go cannot run them.
- The README still says SDK 54 / RN 0.81.5 — `package.json` is the truth.

## Architecture rules (see `docs/frontend-architecture.md`)

- `app/` route files only compose a feature screen: no fetching, validation, persistence or
  business rules.
- Features live in `src/features/<feature>/` and own their screens, hooks, services, schemas,
  tests and types. Features never import from `app/`. Shared code never imports from a feature.
- Use `@/` imports (maps to `src/`). No deep relative imports.
- UI uses the design system in `src/design-system/` (tokens, theme, components). No ad-hoc
  colors or one-off styles that bypass tokens. Every screen supports light and dark.
- State ownership: component state → React; server state → React Query (never copy into
  another store); forms → React Hook Form; validation → feature Zod schemas.
- API access goes through the typed client in `src/api/`. The contract is
  `src/api/contract/openapi.json`; regenerate types with `npm run api:generate` and verify with
  `npm run api:check` whenever the backend contract changes.
- Accessibility is required: labels on every control, logical focus order, VoiceOver,
  Dynamic Type, 44pt touch targets, reduced motion.
- Offline: mutations are not replayed automatically; drafts are kept for explicit retry.

## Key existing behavior (do not break)

- Today, Plan and Quick Log all create items through `POST /api/v1/plan/items` with an
  Idempotency-Key (see `src/features/today/`). Quick Log shows `plan_item.create` only when the
  Today response `capabilities.actions` includes it.
- Today and Quick Log use the device IANA timezone; it is synced to the account via
  `PUT /api/v1/account/timezone`.
- Notification permission is contextual only (never prompted at launch). The Inbox does not
  depend on OS permission. No push tokens yet.
- Onboarding is 8 sequential screens ending with the heading "You're Ready".

## Validation (run all; report results)

```bash
nvm use
npm ci                 # only if dependencies changed or node_modules is missing
npm run format:check
npm run lint
npm run typecheck
npm test -- --runInBand
npm run api:check      # when the API contract changed
npm run doctor         # online checks may fail offline; report, do not "fix"
```

## Current work: Voice v1 (POS-VOICE-PRD-001)

Voice v1: tap a mic on Today, Plan or Quick Log; speak one task; on-device recognition only
(Apple SpeechAnalyzer, iOS 26+, en-US); a local rule-based parser builds one proposal; the user
edits it on a review card and taps Add; the app saves through the existing create path.
Audio, words and the card exist in memory only — never stored, logged or sent.
Milestones in this repo:

- **VOICE-M1** — `modules/pos-voice` native Expo Module (Swift) + hidden debug screen;
  must fail closed (no listening if on-device is unavailable; no server fallback; no audio file).
- **VOICE-M2** — parser in `src/features/voice/parser` (pure TypeScript, no dependencies,
  versioned grammar, golden test set of at least 400 utterances, at least 95% exact match).
- **VOICE-M4** — Voice sheet, review card, clarifications, error flows, purge rules, behind both
  the server capability `voice_entry.create` and `EXPO_PUBLIC_VOICE_ENABLED` (default false).

Do not start a Voice milestone until the founder gives you its approved milestone prompt.

## Implementation & Validation Report (end every milestone with this)

```
# <Milestone ID> — Implementation & Validation Report
Repo / branch / base commit:
Scope implemented: (bullets, mapped to spec requirement / AC IDs)
Out of scope / not done: (and why)
Files changed: (path — one-line purpose)
Dependencies / native config changes: (package@version, plugins, Info.plist keys, or "none")
API contract usage: (endpoints used; regenerated types yes/no)
Accessibility review: (what was checked)
Security & privacy review: (what was checked; confirm no content in logs/storage)
Validation results: (each command + pass/fail + counts)
Manual test gates for the founder: (numbered; each: setup, action, expected result, YES/NO)
Device / build notes: (dev client rebuild needed? simulator vs physical iPhone)
Risks / follow-ups:
Git commands: (single copy-paste block)
```
