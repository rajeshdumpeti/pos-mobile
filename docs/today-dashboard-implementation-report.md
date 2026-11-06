# Today Dashboard Core v1 — local implementation report

This report records the initial core delivery. Subsequent presentation changes, dependencies and current verification are recorded in [Today v1 visual polish](today-visual-polish.md).

Implementation complete locally on `feat/today-dashboard-core`; real backend/native founder acceptance remains outstanding. Mobile HEAD is unchanged: `8016840b6f47d6c69b62e00e94cde18ac72aaf1f`. Develop ancestry and inactive Git operations were verified before editing; the starting tree was clean.

Backend delivery `6bde40e0800ef36a9edefec9c6acbf5cc16d1e74`, Today contract `1.0`. Canonical schemas/docs were inspected read-only at that SHA; backend remained clean. OpenAPI snapshot, metadata and generated types were refreshed; `api:check` passes. No dependency or lockfile changes.

Delivered Today, score breakdown, capability-filtered Add/Quick Log, protected Create/Detail/Edit, and explicit versioned completion. Confirmed backend content drives status/order/score/wins; unavailable measurements and unsupported actions have honest treatment. Idempotent creation retries retain identical intent, conflicts require review, drafts stay in memory, account transitions clear feature queries/mutations, and automatic mutation replay is disabled. See [implementation and acceptance](today-dashboard-core.md) for recovery and time semantics.

Visual differences from reference: existing violet semantic tokens and approved header preserved; unsupported nutrition/water/budget/workout metrics and decorative data illustration omitted; native static score indicator avoids motion. Large text stacks columns. No backend or deferred-domain implementation changes.

## Validation

- Baseline: 48 suites / 374 tests. Full implementation Jest: **54 suites / 410 tests passed**; final presentation-only follow-up checked with focused Today tests.
- Typecheck, ESLint, Prettier, generated API drift check, Authentication readiness, brand validation, resolved public Expo config and `git diff --check`: passed.
- iOS and Android JavaScript/Hermes exports: passed, temporary output outside repository; no builds, prebuild, EAS, deployment or native project directories.
- Expo Doctor: 16/18 passed. External Expo schema lookup failed with `ENOTFOUND exp.host`; React Native Directory metadata lookup also failed externally. These checks remain unverified; no project defect was reported by the other checks.
- Actual Today components inspected in existing iOS 18.6 / iPhone 16 Pro Expo Go simulator, light and dark, using an isolated **synthetic test preview** outside the repository. Empty/null hero and score in both themes, plus the light create form, were legible and unclipped. This is component rendering evidence, not real authenticated persistence or founder approval.
- Remaining manual acceptance: real verified/onboarded account against supplied backend; populated dashboard and mutations/recovery end to end; Android native rendering; VoiceOver/TalkBack, large-text/keyboard/modal focus; founder visual acceptance. See the acceptance setup document. No staging-readiness claim.

## Files and exact Git status

Changes cover the Today feature (26 source/test files), three protected routes, existing Today/Quick Log/layout wiring, route inventory/tests, shared Screen refresh support, HTTP path/query boundary, canonical contract/generated files and frontend documentation. Everything is unstaged; no commit, push, PR, merge, deployment or backend edit was made.

```text
 M app/(app)/(tabs)/index.tsx
 M app/(app)/_layout.tsx
 M app/(app)/quick-log.tsx
 M docs/api-architecture.md
 M src/api/client/httpClient.ts
 M src/api/contract/contractMetadata.ts
 M src/api/contract/openapi.json
 M src/api/generated/schema.ts
 M src/design-system/components/Screen.tsx
 M src/navigation/navigationPolicy.test.tsx
 M src/navigation/routes.ts
 M src/test/navigation-shell.test.tsx
?? app/(app)/plan-item-edit.tsx
?? app/(app)/plan-item-new.tsx
?? app/(app)/plan-item.tsx
?? docs/today-dashboard-core.md
?? docs/today-dashboard-implementation-report.md
?? src/features/today/
```
