# @acme/sdk-lite

Lightweight CQRS/DDD helpers for backend services:

- `Result` helpers (`ok/err`)
- `DomainInvariantError`
- Ports: `UnitOfWork`, `IdempotencyStore`
- `withIdempotency` wrapper
- HTTP helpers: `makeRequestHandler`, `respond`, `authFromContext`
- In-memory adapters for tests

## Install

```bash
npm i @acme/sdk-lite zod
# or: pnpm add @acme/sdk-lite zod
```

## Quick Start

```ts
import {
  ok, err,
  withIdempotency,
  InMemoryUoW, InMemoryIdempotencyStore
} from "@acme/sdk-lite";

const res = await withIdempotency<{ id: string }>(
  { options: {
    key: "idem-1",
    command: "DoThing",
    scope: { userId: "usr_id1" },
    payload: { foo: 1 }
  }},
  { uow: InMemoryUoW, store: new InMemoryIdempotencyStore(), hash: (s) => s },
  async (tx) => ok({ id: "123" })
);
```

See docs/ for usage guides & more.