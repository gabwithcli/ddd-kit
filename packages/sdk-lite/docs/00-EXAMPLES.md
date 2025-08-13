# Example usage from an app (draft)

In your service (e.g., apps/orders-service), you could do:

```ts
// deps.ts
import {
  withIdempotency, IdempotencyStore, UnitOfWork,
  makeRequestHandler, authFromContext, respond, ok, err,
  DomainInvariantError, InMemoryUoW, InMemoryIdempotencyStore
} from "@acme/sdk-lite";
import { z } from "zod";

// Prod impls:
const UoW: UnitOfWork = /* drizzle.transaction wrapper */;
const IdemStore: IdempotencyStore = /* Postgres or Redis impl */;

// Command handler:
export function makeCreateOrderHandler(deps: {
  uow: UnitOfWork;
  store: IdempotencyStore;
  hash: (s: string) => string;
  clock: { now(): Date };
  newId: () => string;
  orderRepo: { save(o: any, tx: any): Promise<void> };
  vendorRepo: { exists(id: string): Promise<boolean>; isBlocked(id: string): Promise<boolean> };
}) {
  return {
    handle: (cmd: { userId: string; vendorId: string; items: any[]; idempotencyKey: string | null }) =>
      withIdempotency<{ orderId: string; totalCents: number }>(
        { options: {
          key: cmd.idempotencyKey,
          command: "CreateOrder",
          scope: { userId: cmd.userId },
          payload: { vendorId: cmd.vendorId, items: cmd.items }
        }},
        { uow: deps.uow, store: deps.store, hash: deps.hash },
        async (tx) => {
          if (!(await deps.vendorRepo.exists(cmd.vendorId))) return err(new DomainInvariantError("Vendor does not exist"));
          if (await deps.vendorRepo.isBlocked(cmd.vendorId)) return err(new DomainInvariantError("Vendor is blocked"));
          const orderId = deps.newId();
          const totalCents = cmd.items.reduce((s, it) => s + it.qty * it.unitPriceCents, 0);
          await deps.orderRepo.save({ id: orderId, ...cmd, totalCents }, tx);
          return ok({ orderId, totalCents });
        }
      )
  };
}

// Route:
const CreateBody = z.object({
  vendorId: z.string().min(1),
  items: z.array(z.object({
    sku: z.string().min(1),
    qty: z.number().int().positive(),
    unitPriceCents: z.number().int().nonnegative()
  })).min(1),
  idempotencyKey: z.string().min(1).nullable()
});

export const handleCreateOrderRequest = makeRequestHandler({
  auth: authFromContext("userId"),
  bodySchema: CreateBody,
  map: ({ auth, body }) => ok({ userId: auth.userId, ...body })
});
```

Testing with in‑memory deps in an app:

```ts
import { describe, it, expect } from "vitest";
import { InMemoryUoW, InMemoryIdempotencyStore } from "@acme/sdk-lite";
import { makeCreateOrderHandler } from "../src/handlers/orders"; // your app code

describe("CreateOrder", () => {
  it("creates an order and is idempotent", async () => {
    const handler = makeCreateOrderHandler({
      uow: InMemoryUoW,
      store: new InMemoryIdempotencyStore(),
      hash: (s) => s, // for test simplicity
      clock: { now: () => new Date("2025-01-01") },
      newId: () => "order_1",
      orderRepo: { save: async () => {} },
      vendorRepo: { exists: async () => true, isBlocked: async () => false }
    });

    const cmd = { userId: "u1", vendorId: "v1", items: [{ sku: "A", qty: 1, unitPriceCents: 100 }], idempotencyKey: "k1" };

    const a = await handler.handle(cmd);
    const b = await handler.handle(cmd);

    expect(a.ok && b.ok).toBe(true);
    expect(a.ok && b.ok && b.value.orderId).toBe(a.value.orderId); // same result
  });
});
```

## Why this packaging works

- Tiny, composable surface — Just the primitives you need; no framework lock‑in.
- Strong typing — IdempotencyConfigOptions<T> is generic over your handler’s output.
- Testability — In‑memory UoW and idempotency store let you write end‑to‑end app tests without a DB.
- Portability — Works with Hono, Express, Fastify (or no HTTP at all).
- Docs included — .md files so teammates can browse concepts quickly.
