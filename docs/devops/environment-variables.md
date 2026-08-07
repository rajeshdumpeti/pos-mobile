# Environment variables

POS Mobile uses Expo's built-in environment-variable handling. Environment
files containing real values stay local or in a future approved secret and
configuration system; only `.env.example` is safe to commit.

## Supported environments

### Local

Copy `.env.example` to an ignored `.env` file and keep the example loopback API
URL when running the optional backend on the same computer. Local overrides may
also use `.env.local`.

### Development

Development builds use development-scoped public configuration. A development
API URL may be supplied later by the approved build system, but it must not be a
credential or contain embedded authentication information.

### Staging

Staging builds use staging-scoped public configuration supplied by the future
approved build process. No staging URL is committed to this repository.

### Production

Production builds use production-scoped public configuration supplied by the
future approved release process. No production URL or credential is committed
to this repository.

## Public mobile configuration

`EXPO_PUBLIC_API_URL` is the base URL for the optional POS API. The typed
configuration in `src/config/env.ts` is the only application layer that reads
it directly. Local development fails with a clear message when it is missing.

Expo replaces `process.env.EXPO_PUBLIC_*` references in application code and
includes their values in the distributed JavaScript bundle. Anyone with the
application can inspect those values, so the prefix means public configuration,
not encrypted or secret configuration.

Values allowed in the mobile bundle include public API base URLs, public feature
identifiers, and other non-sensitive client configuration. Values that must
never enter the mobile bundle include JWT signing secrets, database or Redis
credentials, private API keys, service-account credentials, signing keys,
passwords, and privileged tokens.

Real values for development, staging, and production will be supplied only
after the corresponding GitHub and EAS secret-management work is separately
approved. Never log environment values.
