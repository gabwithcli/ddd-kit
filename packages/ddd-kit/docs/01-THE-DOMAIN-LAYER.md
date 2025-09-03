# The Domain Layer: Guarding Your Business Rules

Everything starts here. The domain layer is the heart of your software. It contains the logic, the rules, and the language of the business. It knows nothing about databases, HTTP requests, or frameworks. It is pure, unadulterated business.

### The Aggregate Root

Think of an **Aggregate** as a small family of objects that must always be consistent. The **Aggregate Root** is the patriarch or matriarch of that family. It's the only member of the family that the outside world is allowed to talk to. Any request to change something inside the family must go through the Root.

This enforces consistency. For example, in our `finance-api`, the `RealEstate` aggregate ensures that you can't add an appraisal dated *before* the property was purchased.

Our `AggregateRoot` base class gives you a few things for free:
* A unique `id`.
* A `version` number for optimistic concurrency control (preventing two people from changing the same thing at the same time).
* A way to record and pull **Domain Events** using the robust "Raise/Apply" pattern.

```typescript
// packages/ddd-kit/src/domain/aggregate.ts

export abstract class AggregateRoot<Id extends string = AggregateId<any>>
  extends Entity<Id>
  implements HasVersion
{ 
  public version = 0;
  protected readonly _events: Array<DomainEvent> = []; 

  // ... implementation ...

  // Command methods call this to announce a state change.
  protected raise(event: DomainEvent) {
    // It applies the state change...
    this.apply(event);
    // ...and buffers the event for persistence.
    this._events.push(event);
  }

  // The single place where state is allowed to be mutated.
  protected abstract apply(event: DomainEvent): void;

  public pullEvents() {
    const out = [...this._events];
    this.clearEvents();
    return out;
  }
}
```

## Entities and Value Objects

Within an aggregate, you have two other types of objects:

- **Entity**: An object with a distinct identity that persists over time. In our `finance-api`, an `Appraisal` is an Entity. It has its own ID (`appr_...`). We can change its date or value, but it's still the same appraisal.

- **Value Object**: An object defined by its attributes, not its identity. An `Address` is a perfect example. If you change the street, it's a completely different address. They are immutable and compared by their values. `Money` is another classic example.

The `ddd-kit` provides base classes for these concepts. The `ValueObject` even has a helpful equals method.

```typescript
// apps/finance-api/src/domain/real-estate/types.ts
import { ValueObject } from "ddd-kit/domain";

export class Address extends ValueObject<{
  line1: string;
  line2?: string;
  postalCode: string;
  city: string;
  country: string;
}> {
  static of(a: Address["props"]) {
    return new Address(a);
  }
}
```

## Enforcing Rules with Invariants

Invariants are rules that must always be true. The best place to enforce them is inside the aggregate's methods. The kit provides a handy `invariants` helper to check multiple rules at once and return a structured error.

```typescript
// apps/finance-api/src/domain/real-estate/real-estate.aggregate.ts
import { invariants } from "ddd-kit/domain";

export class RealEstate extends AggregateRoot {
  // ... properties and methods ...

  private runValuationInvariants(v: { date: string; value: Money }) {
    invariants({ aggregate: "RealEstate", id: this.id })
      .ensure(
        "Valuation date cannot be before purchase date.",
        "valuation.date_before_purchase",
        new Date(v.date) >= new Date(this._purchase.date) 
      )
      .ensure(
        "Valuation currency must match the asset's base currency.",
        "valuation.currency_mismatch",
        v.value.currency === this._details.baseCurrency
      )
      .throwIfAny(); // Throws a single `DomainInvariantError` if any check fails
  } 
}
``` 

This keeps your domain objects clean, protected, and the single source of truth for business logic.

---

## 🏛️ The "Raise/Apply" Pattern: Unifying CRUD and Event Sourcing

To achieve true persistence agnosticism, the `AggregateRoot` in `ddd-kit` uses a pattern that separates the *decision* to make a change from the *application* of that change. This is the **"Raise/Apply"** pattern.

Think of it like a corporate decision:
1.  **The Command Method (The Board Meeting):** A public method like `updateDetails()` is where the business decision is made. It runs all the necessary checks and invariants to ensure the command is valid.
2.  **`raise(event)` (The Official Announcement):** Once the decision is validated, the command method doesn't directly change anything. Instead, it calls `this.raise(event)`, creating an official, immutable record of what was decided.
3.  **`apply(event)` (The Departments):** The `raise` method immediately passes that new event to a protected `apply()` method. This method is the only place in the aggregate where state is allowed to change. It acts like the various departments (accounting, logistics) that execute the board's decision based on the official announcement.

This pattern ensures your domain logic is pure—it only produces events. How the resulting state is stored is a detail left to the infrastructure layer.

### How It Works for a CRUD Repository

For a standard state-based repository, the lifecycle is straightforward:

1.  **Load:** The repository fetches the latest state of the aggregate from the database and uses the static `fromState()` factory to instantly rehydrate the object. This is like getting a snapshot of the company's current financial state.
2.  **Execute:** You call a command method (e.g., `aggregate.updateDetails(...)`).
3.  **Raise & Apply:** The method validates the input and calls `raise(event)`. This immediately calls `apply(event)` internally, which mutates the aggregate's in-memory state.
4.  **Save:** The repository takes the full, now-modified state of the aggregate and saves it back to the database, typically via an `UPDATE` statement that also checks the `version` for optimistic concurrency. The events that were raised can be passed to an event publisher.

### How It Works for an Event Sourcing Repository

This is where the pattern truly shines. The *exact same aggregate code* supports a completely different persistence model:

1.  **Load:** The repository fetches the entire stream of historical events for the aggregate. It creates a *blank* instance of the aggregate and then replays each event through the `apply()` method, one by one, to reconstruct the current state.
2.  **Execute:** You call the same command method (`aggregate.updateDetails(...)`).
3.  **Raise & Apply:** The method works identically, calling `raise(event)` which then calls `apply(event)` to update the in-memory state based on this single new event.
4.  **Save:** The repository calls `pullEvents()`, which gets *only the new event(s)*. It then appends just these new events to the event stream in the database.

By structuring your aggregates this way, you make your domain model incredibly resilient to changes in infrastructure, which is a cornerstone of building robust, maintainable systems.