# @acme/ddd-kit: A Pragmatic DDD Toolkit

A small collection of sharp, focused tools for taming complex business logic in TypeScript. This isn't a framework; it's a set of patterns, inspired by the **Domain-Driven Design (DDD) philosophy**, to help you build robust, maintainable, and testable applications. 


### Philosophy

This kit is built on a few core beliefs: your **domain logic is your most valuable asset**, persistence is a detail, and **testability is a core feature**, not an afterthought.

In small, fast-moving teams, our code should directly model the business domain, using the same terminology our experts use. This creates a **Ubiquitous Language** that bridges the gap between technical implementation and business reality. 


---

### Core Building Blocks

This kit provides a set of composable primitives to structure your application:

* **`AggregateRoot`**: A base class for your domain models that guards business rules (invariants) and manages state changes.
* **`ICommand` & `CommandHandler`**: A pattern to encapsulate every business operation into a clean, transactional pipeline (`load -> execute -> save`).
* **`Result<T, E>`**: A simple `ok` or `err` wrapper to handle outcomes without throwing exceptions.
* **`UnitOfWork`**: An abstraction to ensure that all database operations for a command succeed or fail together (atomicity).
* **`AggregateRepository`**: A generic port for loading and saving your aggregates, decoupling your domain from the database.
* **`withIdempotency`**: A wrapper to make your command handlers safe to retry, preventing duplicate operations.
* **HTTP Helpers**: Utilities (`makeRequestHandler`, `respond`) to standardize auth, validation, and response formatting at the API edge.

---

### A 30-Second Tour

Here's a glimpse of how the pieces fit together.

**1. Define a rule in your Aggregate:**
```typescript
class Order extends AggregateRoot {
  cancel(reason: string) {
    if (this.status === 'SHIPPED') {
      throw new DomainInvariantError('Cannot cancel a shipped order.');
    }
    this.status = 'CANCELLED';
    this.record('OrderCancelled', { orderId: this.id, reason });
  }
}
```

**2. Create a Command for the use case:**
```typescript
class CancelOrderCommand implements ICommand<{ reason: string }, { ok: boolean }, Order> {
  execute(payload: { reason: string }, aggregate: Order) {
    aggregate.cancel(payload.reason);
    return ok({ aggregate, response: { ok: true }, events: aggregate.pullEvents() });
  }
}
```

**3. The `CommandHandler` runs the operation in a transaction:**
```typescript
const handler = new OrderCommandHandler(/* ...dependencies... */);

// This entire operation is atomic and safe.
const result = await handler.execute('cancel-order', {
  aggregateId: 'order_123',
  payload: { reason: 'Customer changed their mind.' },
});
```

---

## Dive Deeper: The Guides
This toolkit is small, but the concepts are powerful. To get the most out of it, please read through the guides.

- [00 - Overview](./docs/00-OVERVIEW.md): Start here for the core philosophy.
- [01 - The Domain Layer](./docs/01-THE-DOMAIN-LAYER.md): Learn about Aggregates, Entities, and guarding invariants.
- [02 - The Application Layer](./docs/02-THE-APPLICATION-LAYER.md): Master the Command and Command Handler patterns.
- [03 - The Infrastructure Layer](./docs/03-THE-INFRASTRUCTURE-LAYER.md): Understand how to persist your aggregates with Repositories and the Unit of Work. 
- [04 - The Interface Layer](./docs/04-THE-INTERFACE-LAYER.md): Connect your core logic to the web with our HTTP helpers.
- [05 - Idempotency](./docs/05-IDEMPOTENCY.md): Make your API robust and safe to retry. 

## What's Next for ddd-kit?
This toolkit is actively under development and will continue to evolve. Here are some of the improvements on the horizon:

**Event Sourcing Support**: While the `AggregateRoot` is already capable of producing domain events, we will be introducing an `AbstractEsRepository`. This will provide a clear pattern for teams who want to adopt an event-sourcing persistence strategy without changing their domain logic.

**Read-Side (CQRS) Helpers**: So far, we've focused heavily on the "Command" side of CQRS—making sure writes are safe, transactional, and clear. The next major focus will be on the "Query" side. We plan to add helpers and patterns for building efficient read models through projections, materialized views, and dedicated query handlers.

