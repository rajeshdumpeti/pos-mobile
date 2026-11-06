# POS Today v1 acceptance execution matrix

Run date: 2026-10-06, America/New_York. Results use the workbook definitions: PASS requires every required check; PARTIAL means supporting checks ran but required acceptance evidence is incomplete; BLOCKED means a prerequisite prevented safe execution.

| ID | Title | Result | Execution method | Evidence | Defect / blocker |
|---|---|---|---|---|---|
| TC01 | Empty Today state | PARTIAL | Backend projection tests and component rendering; native account-A flow unavailable | E07, E09 | B01, B02: no native interaction or empty dedicated account/response pair |
| TC02 | Null score versus genuine zero | PARTIAL | Backend oracle and light/dark component fixtures validated null vs 0% | E07, E09 | B01, B02: no two-account native screenshots/responses |
| TC03 | Daily Status accuracy | PARTIAL | Backend status permutations passed | E09 | B01, B02: no populated native screen-to-response comparison |
| TC04 | Honest progress and unsupported metrics | PARTIAL | Contract/component fixtures hide unsupported actions and measurements | E07, E09 | B01, B02: populated and empty native inspections missing |
| TC05 | Singular and plural copy | BLOCKED | Scenario could not be driven | E14 | B01, B02: no interactive one-item/two-item fixtures or screenshots |
| TC06 | Empty Up Next with unscheduled work | PARTIAL | Backend ordering/projection tests passed | E09 | B01, B02: no native Up Next/priorities comparison |
| TC07 | Unscheduled creation | PARTIAL | Create contract, idempotency, and form payload tests passed | E07, E09 | B01, B02, B03: no durable native create/retrieve; live PostgreSQL proof unavailable |
| TC08 | Duplicate-tap suppression | PARTIAL | Creation coordinator and backend idempotency tests passed | E07, E09 | B01, B02: no native rapid-tap/request-count trace |
| TC09 | Required fields and input validation | PARTIAL | Form and backend schema validation tests passed | E07, E09 | B01, B02: native error, draft retention, and corrected save not executed |
| TC10 | Date/time picker cancellation | PARTIAL | Picker cancellation test passed | E07 | B01, B02: full form dismissal and zero-mutation trace missing |
| TC11 | Scheduled priority creation and local-time fidelity | PARTIAL | DST/timezone and form payload tests passed | E07, E09 | B01, B02, B03: exact saved/retrieved/displayed local time not proven |
| TC12 | NOW/NEXT/LATER authority | PARTIAL | Backend ordering/labels and frontend no-rerank fixture passed | E07, E09 | B01, B02: live response-to-screen comparison, including two past items, missing |
| TC13 | Next Best Action reason and CTA | PARTIAL | Recommendation precedence and CTA mapping tests passed | E07, E09 | B01, B02: native CTA target/retrieval not executed |
| TC14 | Unavailable or stale recommendation | PARTIAL | Unsupported-capability fallback fixture passed | E07 | B01, B04: absent/stale runtime fixture and request trace unavailable |
| TC15 | Future-day exclusion and date boundaries | PARTIAL | Local day, rollover, DST, and timezone tests passed | E07, E09 | B01, B02: native future-item save and screen comparison missing |
| TC16 | Item retrieval | PARTIAL | Authenticated GET contract and item-hook tests passed | E07, E09 | B01, B02: open/close/reopen native modal and no-mutation trace missing |
| TC17 | Edit item and persistence | PARTIAL | Versioned update and form-edit payload tests passed | E07, E09 | B01, B02, B03: durable native edit/refresh/reopen missing |
| TC18 | Edit cancellation and validation | PARTIAL | Draft/version and backend invalid-edit tests passed | E07, E09 | B01, B02: native cancel/server-unchanged and corrected-save trace missing |
| TC19 | Confirmed completion | PARTIAL | Pending-state, confirmed-success, idempotent completion tests passed | E07, E09 | B01, B02, B03: native mutation count and durable refresh missing |
| TC20 | Active removal and unique wins | PARTIAL | Backend active-section removal/win deduplication tests passed | E09 | B01, B02: native before/after sections and repeated refresh missing |
| TC21 | Score and breakdown reconciliation | PARTIAL | Backend score oracle/rounding/deduplication tests passed | E09 | B01, B02: native baseline/completion/breakdown comparison missing |
| TC22 | All eligible items complete | PARTIAL | Backend complete-state projection tests passed | E09 | B01, B02: native final-state, CTA, wins, and metrics inspection missing |
| TC23 | Completion failure | PARTIAL | Backend rollback and frontend confirmed-only/haptic tests passed | E07, E09 | B01, B04: installed-app failure and explicit-retry trace unavailable |
| TC24 | Optimistic-concurrency conflict | PARTIAL | Backend stale-version and frontend review-before-retry tests passed | E07, E09 | B01, B02, B03: two live authorized clients and durable retry proof missing |
| TC25 | Refresh and freshness | PARTIAL | Query refresh/retained-confirmed-data tests passed | E07 | B01, B02: pull-to-refresh recording and read-count trace missing |
| TC26 | Offline read and recovery | PARTIAL | Offline retained-data/recovery policy tests passed | E07 | B01, B04: installed-app disconnect/reconnect trace missing |
| TC27 | Offline create/edit and explicit retry | PARTIAL | Offline mutation suppression/no reconnect replay test passed | E07 | B01, B04: installed-app draft and explicit one-request retry missing |
| TC28 | Timeout and uncertain mutation outcome | PARTIAL | HTTP timeout classification and backend idempotency tests passed | E06, E09 | B01, B04: delayed-after-commit runtime harness/reconciliation unavailable |
| TC29 | Error response matrix | PARTIAL | 401/403 session handling and backend 422/500/503 paths exercised; safe-error tests passed | E07, E08, E09 | B01, B04: installed-app per-status evidence incomplete; Today-specific 429 not executed |
| TC30 | Malformed success and response validation | PARTIAL | Malformed Today success was rejected before presentation | E07 | B04: independent malformed mutation fixtures and installed-app output missing |
| TC31 | Cold launch and onboarding boundaries | PARTIAL | Signed-out native launch observed; routing tests passed | E06, E14 | B01, B02: completed/incomplete account launches and valid-session restore missing; auth banner unavailable |
| TC32 | Sign-out and account isolation | PARTIAL | Account-transition cache/draft isolation tests passed | E07 | B01, B02: B→C→B native flow and transient-flash recording missing |
| TC33 | Modal lifecycle and focus return | PARTIAL | Focus-return and draft-policy component tests passed | E07 | B01, B02: native gesture/backdrop/scroll-lock loop missing |
| TC34 | Keyboard and sticky form actions | BLOCKED | Native keyboard actions could not be driven | E04, E14 | B01, B02: no native runner; reported keyboard/Continue issue remains unverified |
| TC35 | Safe areas, scroll and navigation | BLOCKED | Native scrolling/navigation could not be driven | E04, E14 | B01, B02: no interactive long-content fixture |
| TC36 | Light and dark presentation | PARTIAL | Today/design-system render tests passed in both themes | E06, E07 | B01, B02: paired native states/screenshots unavailable |
| TC37 | Large text and long content | BLOCKED | Accessibility text/scroll scenario could not be driven | E04, E14 | B01, B02: no native runner or long-content account fixture |
| TC38 | Screen reader semantics | BLOCKED | VoiceOver/inspector interaction unavailable | E04, E14 | B01: static semantics exist, but required native evidence is unavailable |
| TC39 | Motion and reduced motion | PARTIAL | Normal/reduced-motion unit tests passed | E07 | B01, B02: paired native recordings unavailable |
| TC40 | Privacy and safe diagnostics | PARTIAL | Backend diagnostic allowlist, frontend cache-key, and safe-error tests passed; private screenshot excluded | E07, E09, E14 | B01, B02: full live-flow log/route audit incomplete |
| TC41 | Responsiveness and load | BLOCKED | No approved budget or representative fixture; native timing unavailable | E04, E14 | B01, B02, B05 |
| TC42 | Final regression and release candidate | BLOCKED | Automation ran, but candidate is dirty and required P0/P1 acceptance is incomplete | E02, E06, E08, E10 | B06; Expo online checks also incomplete under B07 |

Counts: **PASS 0 · FAIL 0 · PARTIAL 35 · BLOCKED 7 · NOT TESTED 0 = 42**.

