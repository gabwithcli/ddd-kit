# Command Blueprints (CRUD + ES)

This module offers **two runners** so teams don’t reinvent command execution:

- **CRUD**: `makeCrudCommand({ load, policies?, run, save, publish? })`
- **Event Sourcing**: `makeEsCommand({ load, policies?, run, append, publish? })`

Both flows:

1. **PREP** (load history or state)
2. **CHECK** policies (invariants)
3. **EXEC** command logic
4. **SAVE** (persist state or append events)
5. **PUB** (optional event publisher)

Use together with:
- `withIdempotency()` — safe retries
- `UnitOfWork` — transaction/context
- `makeRequestHandler()` — edge validation

See `crud/` and `es/` source files for detailed comments and types.

## Policies

Write small and focused, business rules:
```ts
predicatePolicy("Vendor must exist", async ({ env, cmd }) => env.vendorRepo.exists(cmd.vendorId))
```

Combine many policies by passing an array. The blueprint runs them in order and stops on the first error.

## Idempotency + UoW

Wrap your blueprint call in withIdempotency() and provide a UnitOfWork (DB tx or ES context).
This keeps commands safe to retry and ensures consistency.

## CRUD vs ES
- CRUD → run returns { next, response }, and save writes the new state.
- ES → run returns { toAppend, response }, and append writes events with optimistic concurrency.

See the examples in this doc for wiring with in-memory adapters. In production, swap in real repos, UoW, and idempotency store. 

## Tiny usage examples

### CRUD
```ts
const createOrder = makeCrudCommand({
  load: async ({ tx, env, cmd }) => null,
  policies: [
    predicatePolicy("Must have items", ({ cmd }) => cmd.items.length > 0),
  ],
  run: async ({ current, env, cmd }) => {
    const id = env.newId();
    const next = { id, ...cmd, createdAt: env.now() };
    const totalCents = cmd.items.reduce((s, it) => s + it.qty * it.unitPriceCents, 0);
    return ok({ next, response: { orderId: id, totalCents } });
  },
  save: async ({ next, env, tx }) => env.orderRepo.save(tx, next),
});
```

### ES
```ts
const createOrderEs = makeEsCommand({
  load: async ({ tx, env, cmd }) => env.es.readStream(`order-${cmd.orderId}`),
  policies: [
    predicatePolicy("Must have items", ({ cmd }) => cmd.items.length > 0),
  ],
  run: async ({ past, env, cmd }) => {
    const events = [{ type: "OrderCreated", data: { ...cmd, at: env.now().toISOString() } }];
    const totalCents = cmd.items.reduce((s, it) => s + it.qty * it.unitPriceCents, 0);
    return ok({ toAppend: events, response: { orderId: cmd.orderId, totalCents } });
  },
  append: async ({ env, cmd, tx, toAppend, expectedRevision }) =>
    env.es.appendToStream(`order-${cmd.orderId}`, toAppend, expectedRevision),
});
```