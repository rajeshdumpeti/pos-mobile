# POS frontend architecture

This document defines the foundation boundary for POS Mobile. It does not define
product behavior or final screen designs.

## Directory ownership

```text
app/                         Expo Router layouts and thin route composition
src/components/              shared, product-agnostic feedback infrastructure
src/config/                  typed application configuration
src/database/                future SQLite schema, migrations, repositories
src/features/                vertically owned product modules and temporary foundation state
src/lib/query/               shared React Query configuration
src/providers/               app-wide provider composition
src/services/                future shared transport/API primitives
src/design-system/           semantic tokens, theme, NativeWind adapter, icons, and primitives
src/store/                   future shared temporary client state only
src/test/                    future cross-feature fixtures, helpers, and mocks
src/types/                   truly shared types
```

The obsolete prototype screens, routes, components, mock data, store, and React Navigation shell
were removed in the legacy cleanup milestone. They are not approved product references. Expo Router
is the navigation owner; new screens belong in a feature module and consume shared UI through the
design system.

## Routes and features

Files under `app/` select layouts, read route parameters, and compose a screen-level feature
component. They do not fetch, validate, persist, or contain product business rules. During the
temporary foundation state, the root route composes only `FoundationScreen`; route groups will be
added with their first approved consumers.

A future feature lives at `src/features/<feature>/` and may own its screens,
components, hooks, queries, schemas, services, repositories, tests, state, and
types. Create only the folders the feature needs. A feature must not import from
`app/`, and shared infrastructure must not import from a feature. Feature code
may depend on shared components and infrastructure through `@/` imports.

Dependency direction is:

```text
app route -> feature screen/composition -> feature or shared service
          -> shared infrastructure
```

Dependencies never point back toward routes. Avoid deep relative imports and
generic utility dumping grounds. `@/` maps to `src/` in TypeScript, Metro, and
Jest; Expo SDK 54 reads the TypeScript path alias directly for Metro.

## Provider composition

`src/providers/AppProviders.tsx` is the single application provider boundary.
Its order is deliberate:

1. Gesture Handler owns the native gesture root.
2. Safe Area exposes platform insets.
3. The app error boundary provides accessible recovery without deleting data.
4. React Query owns future remote/server state and cache lifecycle.

Database initialization may be added here only after a real schema and migration
contract exists. Initialization errors must reach the recovery boundary; they
must never trigger an automatic database or preference reset.

## State ownership

| Data type                               | Owner                                           |
| --------------------------------------- | ----------------------------------------------- |
| Component-only UI state                 | React component                                 |
| Shared temporary client state           | Zustand feature or shared store, once installed |
| Server state                            | TanStack React Query                            |
| Small durable non-sensitive preferences | MMKV-backed preference adapter                  |
| Structured offline/domain records       | Expo SQLite repository, once installed          |
| Form state                              | React Hook Form, once installed                 |
| Validation                              | Zod schema owned by the feature, once installed |

Never copy server responses into Zustand. Do not put secrets in MMKV. UI and
route files never call SQLite directly. New SQLite access belongs behind a
repository in `src/database/` or a feature repository that depends on shared
database infrastructure. No domain tables exist yet.

Zustand, React Hook Form, Zod, and Expo SQLite are intentionally not installed
until their first approved runtime consumer is implemented. The ownership rules
remain fixed while avoiding dormant direct dependencies.

MMKV is intentionally not installed in this milestone. It requires a native
development runtime and no durable preference contract exists yet. Add it only
with an approved native-capability escalation and an Expo Go fallback or an
approved development-client workflow.

## API and environment boundaries

`src/config/env.ts` is the only module that reads `process.env`. Consumers use
its typed `appConfig` export. `EXPO_PUBLIC_API_URL` is public bundle
configuration and must never contain credentials or secrets. Future transport
primitives belong under `src/services/api/`; endpoint queries, mutations, and
response schemas normally belong to the feature that owns the behavior. Do not
invent an endpoint or contract before it is approved.

## Adding a feature

1. Create `src/features/<feature>/` with only the needed ownership folders.
2. Put validation beside the feature boundary and use React Hook Form for form
   state when a form exists.
3. Put remote cache behavior in React Query hooks and structured offline access
   behind a SQLite repository.
4. Export a screen-level component with no dependency on `app/`.
5. Add a thin route that composes the screen and a focused behavior test.
6. Run the full repository validation suite.

Router tests verify the minimal root, recovery, and not-found composition. New route behavior needs
focused tests when approved screens are added. Native presentation still requires an Expo Go smoke
test.

## Expo Go and native capability policy

The default development path remains Expo Go on a physical iPhone, with Android
compatibility. Prefer Expo SDK modules already supported by Expo Go. Reanimated
and Gesture Handler use SDK-compatible versions. Before adding a
capability that requires native configuration or is absent from Expo Go,
document the need, compatibility and fallback, obtain separate approval, and
move to an approved development-client workflow. Do not run prebuild or generate
native projects as part of ordinary frontend work.

Temporary assumptions: authentication and database initialization are not yet implemented. The
foundation entry is a boot-safe placeholder and must be replaced by the first approved roadmap
screen rather than expanded into product behavior.
