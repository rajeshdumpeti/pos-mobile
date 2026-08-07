# POS Mobile

POS Mobile is the Expo React Native frontend for the Personal Operating System.
It is a UI-first local MVP with typed demo data and an optional connection to
the independently managed POS mock backend.

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
npx expo start --dev-client
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

The currently supported public variable is `EXPO_PUBLIC_API_URL`. When it is
unset or the optional backend is unavailable, the prototype uses bundled demo
data.

See `docs/repository-setup.md` for additional local-development and repository
preparation guidance.

## Frontend architecture

Expo Router owns navigation and route files only compose feature screens. The
provider order, dependency rules, state ownership, offline storage policy, and
feature-module convention are documented in
[`docs/frontend-architecture.md`](docs/frontend-architecture.md).
