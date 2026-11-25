# Voice native module (`modules/pos-voice`)

Milestone: VOICE-M1 (POS-VOICE-PRD-001). Status: developer proof only. No product UI uses it yet.

## Purpose

Capture one spoken English instruction and turn it into text entirely on the iPhone, using
Apple's `SpeechAnalyzer` with the `DictationTranscriber` module (`.progressiveShortDictation`
preset, locale `en-US`). `SFSpeechRecognizer` is never used for recognition. The only
`SFSpeechRecognizer` calls are the static `authorizationStatus()` and `requestAuthorization`,
which are the SDK's only way to read or ask for the speech permission.

iOS 26 or later only. All `SpeechAnalyzer` code sits behind `#available(iOS 26.0, *)`; the app
deployment target is unchanged. Android is a stub that always reports `unsupported_platform`.

## API (`modules/pos-voice`, import via `@/features/voice/native`)

| Function                                                                          | Result                                                                                                                                                                                                     |
| --------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `getAvailability()`                                                               | `{ status, detail? }`. `status` is one of `available`, `unsupported_platform`, `unsupported_os`, `unsupported_locale`, `model_not_installed`, `permission_denied`, `permission_undetermined`, `restricted` |
| `requestPermissions()`                                                            | `{ microphone, speech }`; prompts only for states that are still undetermined                                                                                                                              |
| `installModel()`                                                                  | `'installed' \| 'failed' \| 'unsupported'`. Investigation only; debug screen is the only caller                                                                                                            |
| `start({ locale: 'en-US', maxDurationMs, silenceTimeoutMs, contextualStrings? })` | Resolves once listening. Rejects with `error.code`                                                                                                                                                         |
| `stop()`                                                                          | Finish and deliver final text                                                                                                                                                                              |
| `cancel()`                                                                        | Discard; no final text                                                                                                                                                                                     |
| `onStateChange` / `onPartial` / `onFinal` / `onEnd`                               | Event subscriptions returning `{ remove() }`                                                                                                                                                               |

States: `idle`, `starting`, `listening`, `finishing`, `ended`.
End reasons: `stopped`, `cancelled`, `silence`, `max_duration`, `interrupted`, `backgrounded`,
`error` (with `code`).

## Fail-closed rules

- `start()` re-checks availability natively. If it is not `available`, it rejects with that
  status as the code (for example `model_not_installed`). There is no server or degraded mode.
- The model must already be installed (`AssetInventory.status(forModules:) == .installed`).
  Nothing downloads automatically. `installModel()` exists for the debug screen only.
- Missing native module (old dev client) is reported as `unsupported_platform` /
  `native_module_missing`.
- Only one session at a time: a second `start()` rejects with `already_active`.
- Rejection codes: availability statuses, `already_active`, `invalid_options`,
  `no_audio_input`, `no_audio_format`, `audio_converter_unavailable`, `speech_error_<n>`,
  `native_error_<n>`.

## End conditions

| Trigger                                                                  | Reason           | Final text delivered |
| ------------------------------------------------------------------------ | ---------------- | -------------------- |
| `stop()`                                                                 | `stopped`        | yes                  |
| `cancel()`                                                               | `cancelled`      | no                   |
| `maxDurationMs` elapsed (product value 30000)                            | `max_duration`   | yes                  |
| `silenceTimeoutMs` (1500) with no new recognized text after speech began | `silence`        | yes                  |
| Audio session interruption (call, Siri)                                  | `interrupted`    | no                   |
| App enters background                                                    | `backgrounded`   | no                   |
| Any error                                                                | `error` + `code` | no                   |

Every path stops the engine, removes the tap, releases the analyzer, and deactivates the audio
session with `.notifyOthersOnDeactivation`. The audio session is `.record` only while listening.

## Privacy rules

- Recognized text and audio are never logged (no `print`, `NSLog`, `os_log`, `console.log`) in
  native or JS code. Errors are reported as codes only.
- Audio is held in memory only and never written to a file.
- No analytics or crash reporting. Debug screen shows text on screen only.

## Open the debug screen

Dev builds only (`__DEV__`); release builds redirect to Today. There is no link in the UI.

```bash
xcrun simctl openurl booted "pos://dev/voice-debug"      # simulator
npx uri-scheme open "pos://dev/voice-debug" --ios         # any running dev client
```

On a device, type `pos://dev/voice-debug` into Safari, or use the dev client's URL entry.
The app must be signed in; the route sits behind the normal access boundary.

## Build the dev client

```bash
npm run start:dev-client                       # Metro
npx expo run:ios --device <device-udid>        # local build, no EAS
```

The iPhone needs iOS 26+ and Developer Mode on. Rebuild whenever `modules/pos-voice/ios` changes.
The generated `ios/` folder is git-ignored. Note that two existing Jest suites
(`native-brand-assets`, `auth-readiness`) fail while a generated `ios/` folder exists.

## Known limitations

- Speech authorization is read through `SFSpeechRecognizer.authorizationStatus()`; SpeechAnalyzer
  itself may not require it, but the PRD asks for the permission state.
- Contextual strings use `AnalysisContext.contextualStrings[.general]`; failure to apply is ignored.
- `en-US` only. No Android speech.
- The en-US locale stays reserved (`AssetInventory.reserve`) after a session so the next start is fast.
