# EAS build foundation

This repository contains the local configuration foundation for future EAS
builds. It is linked to an Expo project, but it does not yet have credentials,
registered devices, EAS-hosted environment values, cloud builds, or submission
workflows.

## CLI strategy

EAS CLI is invoked as `npx eas-cli@21.7.0` with an explicit version; no global
or project-local installation is required. The version constraint in
`eas.json` matches the command version. Using an explicit version keeps the
workflow reproducible and satisfies Expo Doctor's dependency guidance.

## Build profiles and environments

| EAS profile   | EAS environment | Intended use                                                                   |
| ------------- | --------------- | ------------------------------------------------------------------------------ |
| `development` | `development`   | Developer-owned physical-device development client distributed internally      |
| `preview`     | `preview`       | Internal shareable validation build using non-production preview configuration |
| `staging`     | `preview`       | Internally distributed, production-like release-candidate validation           |
| `production`  | `production`    | Future official store-ready build; no build or submission is configured        |

The development profile enables a development client. Development, preview,
and staging use internal distribution. The production profile intentionally
uses the EAS store-distribution default, but defining it does not build, submit,
or provision the application. No submission profiles are defined.

POS retains a distinct `staging` build profile and logical environment even
though EAS accepts only `development`, `preview`, and `production` environment
names. The staging profile therefore uses the EAS `preview` environment. Actual
staging API and configuration values will be configured separately; no staging
or production URL is hard-coded, and no production secrets exist.

`EXPO_PUBLIC_*` values are embedded in the client bundle and are visible to
anyone who can inspect the application. They are public configuration, not
secrets. Mobile secrets must never use an `EXPO_PUBLIC_*` name. Backend
credentials, signing keys, private API keys, database credentials, and service
tokens must never enter EAS public variables or the mobile bundle.

## Application identity and project linkage

The current Expo configuration provides the app name `POS`, slug
`personal-operating-system`, application version `1.0.0`, owner `rajesh05db`,
and EAS project ID `7eda4110-a762-4d91-b02e-646e9ff2c1fa`.

The Expo project is linked. Do not run `eas init` again.

The permanent native identity approved by the founder is:

- iOS bundle identifier: `com.personaloperatingsystem.mobile`
- Android package: `com.personaloperatingsystem.mobile`
- initial iOS build number: `1`
- initial Android version code: `1`

Bundle and package identifiers are the platform-level identity used for store
records, signing, entitlements, deep links, and installed-app continuity. They
should almost never change after release because a new identifier is treated as
a different application and cannot replace the existing installation or store
listing.

The runtime version uses Expo's `fingerprint` policy. Expo SDK 54 derives the
runtime from native dependencies and configuration, so a native compatibility
change produces a different runtime automatically. This prevents a future
over-the-air update from being delivered to an incompatible native binary
without requiring maintainers to manage a separate runtime string manually.

Expo updates are explicitly disabled. No update URL or channel is configured,
so this identity foundation does not enable production updates. Any future EAS
Update rollout requires separate approval and configuration.

## Versioning strategy

- `expo.version` is the user-visible application version. Change it only for a
  planned release using semantic product versions such as `1.0.0`.
- `ios.buildNumber` is an App Store build sequence represented as a string.
  Each uploaded build for an application version must have a unique value.
- `android.versionCode` is a monotonically increasing integer for Android
  releases.
- EAS `appVersionSource: local` reads the version and native build values from
  the repository. `remote` lets EAS manage native build numbers and is useful
  once automated builds and shared release ownership exist.

POS currently uses the local version source so release inputs remain explicit
and reviewable in source control. The initial iOS build number and Android
version code are both `1`. Increment each native build number for every new
binary uploaded to its corresponding store; do not increment them merely for
local JavaScript changes. After automated builds are established, reassess a
remote version source with controlled auto-incrementing to prevent duplicate
cloud build numbers.

## Developer workflow

Install and start local Expo development:

```bash
npm ci
npm start
```

Prepare Metro for an already installed development client:

```bash
npx expo start --dev-client
```

Inspect the public Expo configuration:

```bash
npx expo config --type public
```

Validate a build profile locally without starting a build:

```bash
npx eas-cli@21.7.0 config --platform ios --profile development
```

The following release steps are **NOT YET CONFIGURED**:

- Apple credentials
- physical iOS device registration
- EAS cloud development build
- TestFlight distribution
- production build submission

After those prerequisites receive separate approval, a future development build
would use the `development` profile. Do not run `eas build`, `eas submit`,
`eas update`, credential commands, or device-registration commands as part of
this foundation.
