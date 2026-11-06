# Evidence index

All paths are relative to this QA output directory. Logs contain no passwords, tokens, cookies, authorization headers, verification codes, or database URLs.

| Ref | Artifact | Purpose |
|---|---|---|
| E01 | `evidence/run-environment.log` | Run timestamp, macOS, Node, npm, Xcode |
| E02 | `evidence/mobile-git-baseline.log` | Mobile branch, SHA, dirty files and diff summary |
| E03 | `evidence/backend-git-baseline.log` | Backend branch, SHA, clean state and Python version |
| E04 | `evidence/simulator-environment.log`, `evidence/simulator-app-identity.log`, `evidence/native-runner-inventory.log` | Booted simulator, installed POS bundle, and available runner inventory |
| E05 | `evidence/backend-health.json`, `evidence/metro-status.txt`, `evidence/runtime-openapi.json` | Local backend/Metro reachability and runtime API schema |
| E06 | `evidence/mobile-jest.log` | Full frontend Jest run: 60 suites, 436 tests passed |
| E07 | `evidence/mobile-today-jest.log` | Today-focused Jest run: 12 suites, 61 tests passed; includes React `act(...)` warnings |
| E08 | `evidence/backend-pytest.log` | Full backend pytest run: 353 passed, 56 skipped |
| E09 | `evidence/backend-today-pytest.log` | Today/planning focused pytest run: 66 passed |
| E10 | `evidence/mobile-typecheck.log`, `mobile-lint.log`, `mobile-format-check.log`, `mobile-api-check.log`, `mobile-git-diff-check.log`, `mobile-auth-readiness.log`, `mobile-brand-validate.log`, `mobile-public-config.log`, `backend-compileall.log`, `backend-import.log` | Static, contract, configuration and import checks |
| E11 | `evidence/mobile-doctor.log` | Expo Doctor: 16/18 passed; two online metadata checks failed because `exp.host` was unreachable |
| E12 | `evidence/acceptance-source-text.txt` | Text extracted from the authoritative 27-page acceptance PDF for traceability |
| E13 | `render_acceptance_pdf.swift`, `extract_acceptance_pdf.swift` | Isolated QA-only PDF inspection helpers |
| E14 | `evidence/simulator-launch-observation.md` | Sanitized native launch observation and interaction/privacy limits |

No screenshot is indexed. The only runtime screenshot captured during capability verification contained a persisted private email address and was deleted. This follows the workbook's evidence-privacy rule.
