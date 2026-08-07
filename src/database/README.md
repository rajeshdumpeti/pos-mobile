# Database boundary

Expo SQLite will own structured offline and domain records after its first
approved consumer is implemented and the dependency is installed. Future schema
and migration code belongs under `schema/` and `migrations/`, while UI and route
files access records only through typed repositories. No product-domain schema
or automatic destructive recovery is approved yet.
