# Feature modules

Each product feature owns only the screens, components, hooks, queries, schemas,
services, repositories, state, tests, and types it needs. Features may import
shared infrastructure through `@/`; they must not import route files. Shared
infrastructure must not import features.
