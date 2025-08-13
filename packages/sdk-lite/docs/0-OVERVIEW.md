# SDK Overview

`@acme/sdk-lite` provides small, composable building blocks for backend services:

- **Result**: `ok/err`
- **Domain errors**: `DomainInvariantError`
- **Infra ports**: `UnitOfWork`, `IdempotencyStore`
- **Idempotency**: `withIdempotency` for safe command retries
- **HTTP**: `makeRequestHandler`, `respond`, `authFromContext`
- **Test doubles**: `InMemoryUoW`, `InMemoryIdempotencyStore`

Bring your own domain (entities, policies, repos) and wire them to these primitives.
