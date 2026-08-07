# Contributing to POS Mobile

POS Mobile is a UI-first Expo React Native application. Changes must remain
bounded by approved product documentation and preserve accessibility, privacy,
offline behavior, and the calm POS experience.

## Branch flow

Create `feature/*` or `fix/*` branches from `develop`. Changes progress through
pull requests from `develop` to `staging`, then from `staging` to `main`.

Do not commit directly to shared protected branches once protection is enabled.

## Local validation

Run the complete validation set before requesting review:

```bash
npm ci
npm run format:check
npm run lint
npm run typecheck
npm test -- --runInBand
npm run doctor
```

Keep changes focused. Do not commit dependencies, generated Expo state, real
environment files, credentials, signing material, or private user data.

Use the pull-request template to document testing, accessibility, API,
environment, security, privacy, rollback, and documentation impacts.
