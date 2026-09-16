# POS Mobile

POS Mobile is the Expo React Native frontend for the Personal Operating System. The obsolete demo
presentation has been removed. The app currently boots into a temporary foundation state until the
first approved roadmap screen is implemented.

## Stack

- React Native 0.81.5
- Expo SDK 54
- React 19
- TypeScript
- Expo Router (built on React Navigation)
- TanStack React Query
- Documented ownership boundaries for future Zustand, React Hook Form, Zod, and Expo SQLite use
- Jest and React Native Testing Library
- ESLint and Prettier

## Runtime

- Node.js 22.14.0
- npm 11.5.2

Use the checked-in `.nvmrc`, `packageManager`, and Node engine declaration to
keep local environments consistent.

## Install and start

```bash
nvm use
npm install
npm start
```

From the Expo terminal, press `i` for iOS or `a` for Android. Expo Go may also
be used where supported.

For local Metro development with an already installed development client:

```bash
npm run start:dev-client
```

The repository includes local EAS build profiles for future development,
preview, staging, and production builds. The Expo project is linked;
credentials, device registration, cloud builds, TestFlight, and production
submission are **NOT YET CONFIGURED**. See `docs/devops/eas-build.md` for the
profile mapping, versioning strategy, safe validation commands, and required
founder actions.

## Quality checks

```bash
npm run lint
npm run typecheck
npm test
npm run doctor
npm run format:check
```

Use `npm run format` only for an explicitly approved formatting change.

## Environment variables

Copy `.env.example` to `.env` only when overriding the local API URL. Expo
variables prefixed with `EXPO_PUBLIC_` are included in the application bundle
and must never contain secrets.

The currently supported public variable is `EXPO_PUBLIC_API_BASE_URL`. Connected Authentication
screens use it through the typed transport boundary; it must contain only a public API base URL.

See `docs/repository-setup.md` for additional local-development and repository
preparation guidance.

Repository-owned Authentication acceptance prerequisites can be checked without external access:

```bash
npm run auth:readiness
```

This does not validate accounts, devices, builds, backend services, email, or real Authentication.
Use [`docs/authentication-acceptance-runbook.md`](docs/authentication-acceptance-runbook.md) for the
founder-controlled 1.H process.

## Frontend architecture

Expo Router owns navigation and route files only compose feature screens. The
provider order, dependency rules, state ownership, offline storage policy, and
feature-module convention are documented in
[`docs/frontend-architecture.md`](docs/frontend-architecture.md).

The removed presentation inventory and roadmap handoff are documented in
[`docs/mobile-legacy-cleanup.md`](docs/mobile-legacy-cleanup.md).
