# POS Mobile repository setup

## Prerequisites

- Node.js 22.14.0
- npm 11.5.2
- Expo Go, an iOS Simulator, or an Android Emulator
- The optional POS backend only when testing local API availability

## Local setup

```bash
nvm use
npm install
npm run lint
npm run typecheck
npm test
npm run doctor
npm run format:check
npm start
```

The repository contains only frontend source, configuration, tests, and scoped
documentation. Dependencies, Expo state, build output, local environment files,
signing credentials, and service configuration are ignored.

## Local backend connection

The app reads `EXPO_PUBLIC_API_URL` through the typed `appConfig` exported by
`src/config/env.ts`. No other application module should access environment
variables directly. Copy `.env.example` to `.env` to override the default local
address. A physical device must use an address that can reach the development
computer rather than its own loopback interface.

Never place credentials or private values in an `EXPO_PUBLIC_` variable.

## Backup

Before repository-wide configuration, dependency, migration, or release work,
create a timestamped archive outside this repository. Exclude `node_modules`,
`.expo`, environment files, caches, coverage, and build output, then verify the
archive with `unzip -t`.
