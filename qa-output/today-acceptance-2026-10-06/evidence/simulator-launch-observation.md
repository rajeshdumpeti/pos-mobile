# Sanitized simulator launch observation

- Observed: 2026-10-06 around 21:20 America/New_York
- Device: booted iPhone 16 Plus, iOS 18.6
- App: `com.personaloperatingsystem.mobile`, display name POS, build 1
- Action: launched the installed development client with `xcrun simctl launch --console-pty` while local Metro and FastAPI were already running.
- Actual: the app opened the Sign In screen and displayed `Authentication is temporarily unavailable.`
- Interaction limit: `simctl` could launch and screenshot the app, but it could not tap, type, drive VoiceOver, or inspect native accessibility focus. No Maestro, Detox, IDB, or repository XCUITest plan was available.
- Privacy handling: the raw screenshot contained a persisted private email address. It was deleted and is intentionally absent from the evidence index.
