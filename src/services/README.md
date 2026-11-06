# Service boundary

Shared API transport primitives belong under `api/` when an approved contract
exists. Endpoint-specific queries, mutations, validation, and repositories stay
with the owning feature. All base configuration is read through `appConfig`.
