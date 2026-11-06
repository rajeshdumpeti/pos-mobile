# Environment strategy

POS Mobile recognizes four configuration contexts:

| Context     | Current mapping                                                         |
| ----------- | ----------------------------------------------------------------------- |
| Local       | Developer-owned local configuration and the optional local mock backend |
| Development | Changes integrated on `develop`                                         |
| Staging     | Release candidates promoted to `staging`                                |
| Production  | Production-ready code represented by `main`                             |

No real environment URLs or production deployment are configured. GitHub
environments and EAS environment integration are deferred to separately approved
release work.

The current public mobile configuration name is `EXPO_PUBLIC_API_BASE_URL`. Its value
must be supplied through an approved local or future environment mechanism and
must not be committed when it represents a real environment.
