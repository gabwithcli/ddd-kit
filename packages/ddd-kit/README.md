# @acme/ddd-kit

Lightweight CQRS/DDD helpers for backend services:

- `Result` helpers (`ok/err`)
- `DomainInvariantError`
- Ports: `UnitOfWork`, `IdempotencyStore`
- `withIdempotency` wrapper
- HTTP helpers: `makeRequestHandler`, `respond`, `authFromContext`
- In-memory adapters for tests

## Install

```bash
npm i @acme/ddd-kit zod
# or: pnpm add @acme/ddd-kit zod
```

## Quick Start

```ts
import {
  ok, err,
  withIdempotency,
  InMemoryUoW, InMemoryIdempotencyStore
} from "@acme/ddd-kit";

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