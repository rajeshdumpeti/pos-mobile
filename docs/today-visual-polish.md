# Today v1 visual polish

Local frontend presentation pass on `feat/today-dashboard-core`, following the supplied “POS — Today v1 Visual Polish Specification.” Prior Today implementation changes remain unstaged and preserved. Backend delivery stays `6bde40e0800ef36a9edefec9c6acbf5cc16d1e74`, contract `1.0`; contract, eligibility, score, action identifiers, versioning, confirmation and authentication behavior are unchanged.

Today uses 20-point gutters (16 on compact screens), 24-point section spacing, consistent 24-point card radii, three surface tiers and centralized planning typography. Header structure, greeting/date, initials, notification behavior and bottom tabs remain intact; the header surface is calmer. No fake unread badge, provider insight or metric was added. Priority/win columns stack on compact widths or large text; list cards size naturally, and wins use compact check/title/time rows. Quick action is “Add plan item” with a plus icon.

Five POS-owned code-native vector treatments cover priority, scheduled, getting-started, calm context and completed recommendations. Decorative artwork contains no text or data. The 112-point, 9-point continuous score ring uses semantic accent, preserves null versus zero, and sweeps once for the first available score. Short section entrance, confirmed completion and native sheet motion respect Reduce Motion. No animation drives domain state.

Create/edit group Essential, When and Importance. Title receives create focus and stays neutral until submission or deliberate interaction. Native date/time pickers show Today/Tomorrow/friendly dates and local times. New items automatically use the resolved device timezone; edit preserves the original item timezone. Raw ISO/IANA values are absent from primary controls. A differing time zone is explained only where relevant; item-zone detail is an explicit secondary disclosure.

Wall-time conversion enumerates actual matching instants: nonexistent times cannot be submitted; repeated hours require an explicit earlier/later selection with zone abbreviation. Changing an assigned date clears selected times and asks the user to choose again. Optional end date supports overnight schedules; removing scheduling clears both offsets. Existing unchanged timestamps retain precision. Backend representations and validation remain intact.

Drafts remain in account-scoped memory, survive safe dismissal, and are cleared on confirmed save/account exit. A restored edit retains its original expected version until explicit reconciliation. Ambiguous creation still uses its frozen original payload/key. In-flight form removal is guarded; after confirmation native navigation can proceed. Footer actions sit in the keyboard-avoiding region above safe-area insets. Picker focus returns after native dismissal; navigation restores the launcher (score fallback when completion removed its row).

Detail presents full title, semantic Planned/Priority/Completed chips, assigned/scheduled rows and a confirmed completion area. Complete/Edit stay secondary to the record and remain versioned. Success haptic occurs only after confirmed completion; failed/late results produce no celebration. Physical haptic behavior is device-dependent. Score breakdown keeps the formula and contributions; identifiers are available via an explicit secondary disclosure.

## Native dependencies

SDK 54-compatible additions: `@react-native-community/datetimepicker` 8.4.4, `react-native-svg` 15.12.1 and `expo-haptics` ~15.0.8. The picker config plugin was added. No prebuild/native project directories, builds or permission prompts were run. These packages support native picker UI, vector drawing and confirmation feedback; see the official [picker](https://docs.expo.dev/versions/v54.0.0/sdk/date-time-picker/), [SVG](https://docs.expo.dev/versions/v54.0.0/sdk/svg/) and [haptics](https://docs.expo.dev/versions/v54.0.0/sdk/haptics/) documentation. Existing custom development clients need a compatible native runtime for the added modules; local Expo Go inspection used SDK 54.

## Validation and remaining acceptance

Focused tests cover friendly display, DST gaps/folds/half-hour offsets, native-picker intent, title validation timing, dismissed/restored drafts, retained edit versions, account cleanup, confirmed-only haptic, score sweep/Reduce Motion and launcher/fallback focus.

- Full Jest verification: **58 suites / 427 tests passed**. A subsequent button radius/style-precedence adjustment passed 12 focused Button/Today tests, typecheck and lint.
- Typecheck, ESLint, Prettier, generated API drift, authentication readiness, brand validation, resolved Expo configuration and `git diff --check`: passed. Authentication readiness verifies repository configuration; external authentication acceptance remains separate.
- Final iOS and Android JavaScript/Hermes exports passed. Temporary output is outside the repository; no native release build was performed.
- Expo Doctor: 16/18 passed. Expo schema lookup failed with `ENOTFOUND exp.host`; React Native Directory lookup failed externally. Those two checks remain unverified.
- Dependency installation reported 30 audit vulnerabilities (17 moderate, 13 high). No audit fix or unrelated dependency upgrade was applied; the installation warning remains unresolved.
- Mobile HEAD remains `8016840b6f47d6c69b62e00e94cde18ac72aaf1f`. All core and polish work remains local and unstaged: 21 tracked files modified, 42 untracked files, zero staged files. Backend checkout remains clean at the delivery SHA above. No commit, push, PR, merge or deployment was performed.

Native QA uses clearly labeled synthetic fixtures in an isolated temporary Expo project importing the actual feature components; no fixtures or bypass were added to production routing. It provides rendering evidence, not real authenticated/backend persistence. Final acceptance still requires physical-device keyboard/haptics, VoiceOver/TalkBack, drag dismissal/focus return, Android native picker/sheet behavior, narrow devices, and founder approval against real backend data. Do not treat JavaScript exports as native release or staging acceptance.

iOS 18.6 / Expo Go SDK 54 simulator inspection covered light/dark Today, create entry with neutral autofocus, the native calendar, completed detail and accessibility extra-large text. Inspection corrected stretched row icons and long-title wrapping. Software-keyboard obstruction was not visually verified because the simulator used a hardware keyboard. The simulator text size was restored to its original setting. Android native inspection was unavailable because no Android emulator/ADB was installed.

Viewed screenshots remain outside the repository:

- `/private/tmp/pos-polish-today-light.png`
- `/private/tmp/pos-polish-today-dark.png`
- `/private/tmp/pos-polish-create-keyboard.png` (autofocus evidence; software keyboard absent)
- `/private/tmp/pos-polish-native-picker.png`
- `/private/tmp/pos-polish-complete.png`
- `/private/tmp/pos-polish-complete-large.png`

## Screenshot correction follow-up

User screenshots showed unimplemented native SVG views, content behind the status bar and an unlabeled back chevron. Runtime SVG capability is now checked before rendering: clients without the native views use supported contextual icons and a native View-based continuous score arc with the same percentage/motion behavior. Fully compatible clients retain the original vector artwork. This prevents the pink unimplemented-component blocks without changing score data. The installed SDK 54 Expo Go simulator renders the SVG artwork correctly after a cold reload with a cleared Metro cache; the precise client/cache condition behind the user's screenshots was not independently reproduced.

Screen top safe area now wraps the scroll viewport, so protection remains while scrolling. Create/edit sheets measure their own safe area. Planning headers display a combined “Back” label and chevron. The Date row includes “Choose date” and an accessibility hint; tapping it opens the native calendar, which now has an explicit layout height. The calendar remains a focused native chooser rather than permanent form content.

Verification: final full Jest run passed 59 suites / 429 tests, including two new native-runtime regression tests. Typecheck and lint passed. Formatting and diff whitespace checks passed. Isolated synthetic iOS inspection viewed `/private/tmp/pos-fix-calendar.png`, `/private/tmp/pos-fix-create.png` and `/private/tmp/pos-fix-today.png`, covering the calendar, Back text, status-bar spacing, artwork and score ring. Android native acceptance remains pending. Restart an existing app Metro session with `npx expo start --go --clear` and fully reopen Expo Go to load the new native-package imports cleanly.

## Missing native picker correction

The next user screenshot confirmed that the running client also lacked `RNDateTimePicker`. Reloading cannot add a missing native view to a binary; the previous SVG guard did not handle this second component. Picker capability is now checked before loading its native module. Supported clients keep the native calendar/spinner/dialog. Other clients receive a working React Native calendar with month navigation and a time chooser with hour, exact minute and AM/PM controls. No additional dependency or native build is needed for this compatible path. Done confirms the choice; Cancel preserves the form values. Native loading is deferred because unavailable Android modules can throw during import.

Compatible selection passes date/clock intent directly to the existing named-zone validation. It does not manufacture an offset: daylight-saving gaps remain rejected and repeated hours still require deliberate earlier/later selection. Mutations, expected versions, retries and authentication remain unchanged.

Final verification passed **60 suites / 434 tests**, typecheck, lint, formatting, diff whitespace and iOS/Android JavaScript exports. Tests cover missing native views, leap-day/month navigation, exact minute/period selection, Cancel and compatible-path gap/fold behavior; native-path tests still pass. iOS 18.6 / iPhone 16 Plus synthetic preview explicitly disabled `RNDateTimePicker` and visually verified both `/private/tmp/pos-compatible-time.png` and `/private/tmp/pos-compatible-calendar.png`. This is evidence for the missing-component path, rather than a claim that the user's authenticated session was retested. The temporary preview/server were closed afterward. Android native/device acceptance remains pending.

## Scheduled form footer and modern time entry

The user reported that enabling scheduling and choosing a start time hid the form action. A native warm-navigation preview reproduced the problem: the custom-detent `formSheet` allowed the form's intrinsic content height to exceed its visible sheet bounds. A flex adjustment alone did not fix it. Create/edit now use standard native `modal` presentation, which remains a native sheet on iOS and provides bounded layout. The fixed Back/title header, scrolling fields and non-shrinking footer reserve separate space; “Create plan item” / “Save changes” remain above the home indicator. This deliberately drops the custom 0.93 detent and grabber configuration to preserve a visible, usable primary action. The existing in-flight dismissal guard, safe drafts and mutation behavior remain intact. Native sheet scrolling/layout special handling can be inspected in the installed `react-native-screens` source and its [official source](https://github.com/software-mansion/react-native-screens/blob/4.16.0/ios/RNSScreen.mm).

The compatible time selector now has two large editable numeric fields, a segmented AM/PM choice and :00/:15/:30/:45 shortcuts. Arbitrary exact minutes remain supported. Empty/out-of-range input disables Done and displays a concise correction; it cannot silently confirm the previous value. Done/Cancel sit in a keyboard-safe footer. Closing the chooser dismisses its keyboard. Date selection and existing timezone/DST validation are unchanged.

Final tests: **60 suites / 435 tests passed**, including invalid input, exact minute/period entry, shortcuts, Cancel, DST gap/fold and native picker regression coverage. Typecheck, lint, formatting, whitespace checks and iOS/Android JavaScript exports passed. Synthetic native iOS inspection first reproduced the missing button, then verified `/private/tmp/pos-modern-scheduled-form.png` with scheduling enabled and a start time selected: the primary action is visible at the bottom, and remaining fields scroll above it. `/private/tmp/pos-modern-time.png` shows the compact numeric controls and visible Done/Cancel. Software-keyboard overlap, screen readers and Android native acceptance remain physical/device checks. All changes remain local and unstaged; backend unchanged.

## Software keyboard follow-up

The user's simulator accepted focus and showed a cursor but suppressed the software keyboard because “Connect Hardware Keyboard” was enabled. The simulator preference was changed to disabled and the active iPhone 16 Plus simulator was restarted. Apple documents the equivalent UI under **I/O → Keyboard → Connect Hardware Keyboard** and the software-keyboard toggle; see [Interacting with Simulator](https://developer.apple.com/library/archive/documentation/IDEs/Conceptual/iOS_Simulator_Guide/InteractingwithiOSandwatchOS/InteractingwithiOSandwatchOS.html). This is a simulator setting, not an application runtime behavior on a physical phone.

The application now explicitly enables soft input for shared editable fields and the compatible hour/minute inputs. Create-title autofocus waits for navigation/modal interactions and a short settling interval, preventing the first-responder request from racing the opening transition. The delayed focus is cancelled when the screen unmounts. React Hook Form and the native input share the same ref, so validation focus behavior remains intact.

Final Jest verification passed **60 suites / 436 tests**; typecheck and lint passed. A new shared-input test covers the default soft-input request and its explicit opt-out. Native iOS inspection confirmed that focusing the title invoked the system keyboard surface in `/private/tmp/pos-keyboard-fix.png`. Because this was the simulator's first software-keyboard use, iOS displayed its one-time “Speed up your typing” tutorial over the keyboard; tapping **Continue** once dismisses that operating-system prompt. The automation environment lacked macOS Accessibility permission to press that system button, so the post-tutorial keyboard keys were not captured. Physical-device and Android keyboard acceptance remain pending.
