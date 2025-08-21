# The Domain Layer: Guarding Your Business Rules

Everything starts here. The domain layer is the heart of your software. It contains the logic, the rules, and the language of the business. It knows nothing about databases, HTTP requests, or frameworks. It is pure, unadulterated business.

### The Aggregate Root

Think of an **Aggregate** as a small family of objects that must always be consistent. The **Aggregate Root** is the patriarch or matriarch of that family. It's the only member of the family that the outside world is allowed to talk to. Any request to change something inside the family must go through the Root.

This enforces consistency. For example, in our `finance-api`, the `RealEstate` aggregate ensures that you can't add an appraisal dated *before* the property was purchased.

Our `AggregateRoot` base class gives you a few things for free:
* A unique `id`.
* A `version` number for optimistic concurrency control (preventing two people from changing the same thing at the same time).
* A way to record and pull **Domain Events**.

```typescript
// packages/ddd-kit/src/domain/aggregate.ts

export abstract class AggregateRoot<Id extends string = AggregateId<any>>
  extends Entity<Id>
  implements HasVersion
{
  public version = 0;
  protected readonly _events: Array<DomainEvent> = [];

  // ... implementation ...

  protected record(type: string, data: unknown) {
    this._events.push({ type, data });
  }

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
