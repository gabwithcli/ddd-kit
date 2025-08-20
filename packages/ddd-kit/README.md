# @acme/ddd-kit

**A pragmatic, lightweight toolkit for building robust backend services in TypeScript with Domain-Driven Design principles.**

This kit provides a set of small, composable building blocks to help you manage complexity, enforce business rules, and build maintainable systems, especially in small, fast-moving teams.

---

## 🤔 Why @acme/ddd-kit?

Building backend services often involves reinventing the wheel for common patterns like transactional command handling, idempotency, and error management. This toolkit provides battle-tested solutions for these problems, letting you focus on what's unique: **your domain logic**.

**Core Philosophy:**
-   **Domain First:** Your business rules are the most important asset. They should be explicit, protected, and easy to test.
-   **Pragmatic, Not Dogmatic:** We provide battle-tested patterns without forcing you into a rigid framework. You choose the approach that fits your needs.
-   **Testability is a Feature:** With clear separation of concerns via interfaces like `UnitOfWork` and `AggregateRepository`, you can write fast, reliable tests for your core logic.
-   **Small & Composable:** Import only what you need. The kit is designed to augment your existing stack (like Hono, Express, or Fastify), not replace it.

---

## Core Concepts

Here's a quick tour of the key building blocks. For detailed guides and examples, please see the `docs/` directory.

| Concept              | Description                                                                                                                      | Learn More                           |
| :------------------- | :------------------------------------------------------------------------------------------------------------------------------- | :----------------------------------- |
| **`Result<T, E>`**   | A simple `ok` or `err` wrapper to handle outcomes without throwing exceptions.                                                   | `docs/3-ERRORS.md`                   |
| **`AggregateRoot`**  | A base class for your domain models, providing an identity, versioning for optimistic concurrency, and an event buffer.          | `src/domain/aggregate.ts`            |
| **`ICommand`**       | An interface for encapsulating the logic of a single business operation into a dedicated class.                                  | `src/application/command/command.ts` |
| **`CommandHandler`** | A transactional pipeline that orchestrates the `load -> execute -> save` flow for your commands.                                 | `src/application/command/handler.ts` |
| **`Unit of Work`**   | An abstraction (`UnitOfWork`) to ensure that all database operations for a command succeed or fail together (atomicity).         | `src/infra/unit-of-work.ts`          |
| **Idempotency**      | A wrapper (`withIdempotency`) to make your command handlers safe to retry, preventing duplicate operations.                      | `docs/2-IDEMPOTENCY.md`              |
| **HTTP Helpers**     | Utilities (`makeRequestHandler`, `respond`) to standardize auth, validation (with Zod), and response formatting at the API edge. | `docs/1-REQUEST_HANDLER.md`          |
| **Test Doubles**     | In-memory implementations (`InMemoryUoW`) so you can test your handlers without a database.                                      | `docs/00-EXAMPLES.md`                |

---

## 🚀 Getting Started

### Example: The `CommandHandler` Pattern

Here’s how to structure a feature using the class-based command pattern, which is excellent for managing complexity as your application grows.

#### 1. Define your Aggregate
This is the core of your domain, containing your business rules.

```typescript
// src/domain/order.aggregate.ts
import { AggregateRoot, DomainInvariantError } from "@acme/ddd-kit/domain";

export class Order extends AggregateRoot {
  // ... state properties

  static create(id: string, customerId: string): Order {
    const order = new Order(id);
    // ... logic
    return order;
  }

  public addItem(item: { price: number }) {
    if (item.price <= 0) {
      throw new DomainInvariantError("Item price must be positive.");
    }
    // ... logic to add item and update total
    this.version++;
  }
} 
```

### 2. Create ICommand Classes
Each class represents a single, specific action you can perform.

```typescript
// src/application/order.commands.ts
import { ICommand, CommandOutput } from "@acme/ddd-kit";
import { Order } from "../domain/order.aggregate";
import { ok } from "@acme/ddd-kit";

// Command for creating an order
export class CreateOrderCommand implements ICommand<{ customerId: string }, { id: string }, Order> {
  execute(payload: { customerId: string }) {
    const order = Order.create("new_id", payload.customerId);
    const response = { id: order.id };
    return ok({ aggregate: order, events: [], response });
  }
}

// Command for adding an item
export class AddItemCommand implements ICommand<{ price: number }, void, Order> {
  execute(payload: { price: number }, aggregate: Order) {
    aggregate.addItem(payload);
    return ok({ aggregate, events: [], response: undefined });
  }
}
```

### 3. Implement the CommandHandler
This orchestrator ties everything together within a transaction.

```typescript
// src/application/order.handler.ts
import { CommandHandler } from "@acme/ddd-kit";
import { Order } from "../domain/order.aggregate";
import { CreateOrderCommand, AddItemCommand } from "./order.commands";

export class OrderCommandHandler extends CommandHandler<Order, any> {
  protected commands = {
    "create-order": new CreateOrderCommand(),
    "add-item": new AddItemCommand(),
  };
  // The constructor injects the repository and UoW from the base class.
}
```

### 4. Execute a Command from your API Layer
```typescript
// src/http/order.routes.ts
// Assuming `orderHandler` is an instantiated OrderCommandHandler.

// To create an order:
const result = await orderHandler.execute("create-order", {
  payload: { customerId: "cust_123" },
});

// To add an item to an existing order:
const addResult = await orderHandler.execute("add-item", {
  aggregateId: "order_abc",
  payload: { price: 99.99 },
});
```
This pattern provides a clean, scalable, and highly testable structure for all your business logic. 
