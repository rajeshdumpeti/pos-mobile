# Security policy

POS Mobile is pre-release software. Security fixes are maintained on the latest
supported `main` revision.

## Reporting a vulnerability

Do not open a public issue for a suspected vulnerability or include credentials,
private user data, or exploit details in public discussions. Report the issue
privately to the repository owner through an approved private GitHub channel.
Use GitHub private vulnerability reporting when it becomes available.

Include the affected revision, reproduction conditions, likely impact, and a
sanitized proof of concept when safe. Never include real health, finance,
nutrition, profile, signing, or authentication data.

## Secret handling

Mobile bundle values are observable by users. Variables prefixed with
`EXPO_PUBLIC_` must contain only non-secret configuration. Revoke and rotate any
credential that is accidentally exposed, then remove it from all affected
systems according to the incident-response decision.
