# Idempotency

## Why
Prevent duplicate side-effects when clients retry commands.

## How
Use `withIdempotency` to wrap command execution:
1) `tryClaim` (atomic)
2) if cached → return revived result
3) else run + `saveResponse`

## Config shape
```ts
{ 
  options: {
    key: string | null;
    command: string;
    scope: Record<string, string>;
    payload: unknown;
    toResponse?: (value) => unknown;
    reviveOnHit?: (data) => value;
    clock?: { now(): Date };
  }
}
```

## Infra deps
- uow (UnitOfWork) — your transaction adapter
- store — idempotency storage (PG, Redis, DynamoDB, etc.)
- hash — stable hash function (sha256 recommended)

See src/idempotency/withIdempotency.ts