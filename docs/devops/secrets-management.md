# Secrets management

Expo includes variables prefixed with `EXPO_PUBLIC_` in the client bundle. These
values are public configuration and must never contain secrets.

Do not place database credentials, private API keys, JWT signing keys, signing
keys, service credentials, or private tokens in `EXPO_PUBLIC_*` variables or
source control. Real environment files remain local and ignored. Safe example
files may be committed only with non-sensitive placeholder or local-development
values.

Future CI secrets belong in scoped GitHub repository or Environment Secrets.
Future Expo release secrets belong in EAS secret management after EAS is
separately approved. Do not duplicate secrets across systems without a documented
owner, purpose, rotation plan, and least-privilege scope.

If a secret is exposed, stop distribution, revoke or rotate the credential, and
follow the approved incident-response process. Removing a value from the latest
commit alone does not invalidate an exposed credential.
