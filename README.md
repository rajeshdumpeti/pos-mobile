# POS Mobile

POS Mobile is the Expo React Native frontend for the Personal Operating System.
It is a UI-first local MVP with typed demo data and an optional connection to
the independently managed POS mock backend.

## Stack

- React Native 0.81.5
- Expo SDK 54
- React 19
- TypeScript
- React Navigation
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
