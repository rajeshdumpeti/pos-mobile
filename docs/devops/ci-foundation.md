# CI foundation

The `POS Mobile CI` workflow validates pushes and pull requests involving
`main`, `develop`, or `staging`. It can also be started manually.

The single `validate` job uses the Node.js version in `.nvmrc`, restores npm's
package cache, installs dependencies with `npm ci`, and runs:

```text
npm run format:check
npm run lint
npm run typecheck
npm test -- --runInBand
npm run doctor
```

The expected status-check name is `POS Mobile CI / validate`. The workflow has
read-only repository-content permission, cancels outdated runs for the same
branch or pull request, and has a bounded timeout.

This workflow performs validation only. It does not build with EAS, deploy,
publish artifacts, access secrets, or configure an environment.
