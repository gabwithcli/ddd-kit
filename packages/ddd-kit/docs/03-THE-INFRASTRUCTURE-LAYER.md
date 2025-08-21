# The Infrastructure Layer: Talking to the Outside World

The infrastructure layer contains all the nitty-gritty details of how your application talks to the outside world: databases, message queues, third-party APIs, etc. The key principle is to depend on abstractions (ports) defined in the application layer, not on concrete implementations.

### The Repository Pattern

A **Repository** is an object that provides the illusion of an in-memory collection of your aggregates. It's the port through which the `CommandHandler` loads and saves domain objects.

`ddd-kit` provides a generic `AggregateRepository` interface. This is the contract that any persistence mechanism must fulfill.

```typescript
// packages/ddd-kit/src/application/repos/aggregate.repository.ts
export interface AggregateRepository<AR extends AggregateRoot> {
  findById(tx: Tx, id: string): Promise<AR | null>;
  save(tx: Tx, agg: AR): Promise<void>;
}
```

### Implementing a CRUD Repository

The most common implementation is a CRUD-style repository that maps your aggregate to database tables. The kit provides `AbstractCrudRepository` to make this easier. It already contains the logic to check the aggregate's `version` and decide whether to call `insert` or `update`.

You only need to implement the database-specific parts:
1. `findById`: How to query the database and "rehydrate" your aggregate from raw data.
2. `insert`: How to perform a SQL `INSERT` (or db-specific equivalent) for a new aggregate.
3. `update`: How to perform a SQL `UPDATE` (or db-specific equivalent) for an existing aggregate, including the optimistic concurrency check.

Here's a snippet from the `finance-api`'s PostgreSQL repository:

```typescript
// apps/finance-api/src/infra/persistence/postgres/real-estate/real-estate.repo.postgres.ts
import { AbstractCrudRepository } from "ddd-kit";
import { RealEstate } from "../../../../domain/real-estate/real-estate.aggregate";
// ... other imports

export class RealEstatePostgresRepo extends AbstractCrudRepository<RealEstate> {
  async findById(tx: Tx, id: string): Promise<RealEstate | null> {
    // ... Drizzle logic to SELECT from real_estates and child tables ...
    // ... then call RealEstate.fromState(...) to rehydrate the object ...
  }

  protected async insert(tx: Tx, agg: RealEstate): Promise<void> {
    // ... Drizzle logic to INSERT into real_estates and child tables ...
  }

  protected async update(tx: Tx, agg: RealEstate): Promise<void> {
    // ... Drizzle logic to UPDATE real_estates with a WHERE clause
    // that checks both id AND version for optimistic concurrency ...
    // ... followed by a "delete-and-re-insert" for child tables ...
  }
}
```

### The Unit of Work

How do we ensure that loading the aggregate, saving it, and publishing events all happen atomically? Through the **Unit of Work** pattern.

The `UnitOfWork` interface has a single method, `withTransaction`. It takes a function, starts a database transaction, executes your function, and then commits. If anything goes wrong, it rolls the transaction back.

```typescript
// packages/ddd-kit/src/infra/unit-of-work.ts
export interface Tx {} // An opaque handle for the transaction

export interface UnitOfWork {
  withTransaction<T>(fn: (tx: Tx) => Promise<T>): Promise<T>;
}
```

The `CommandHandler` uses this internally, so you get transactional safety for free with every command you execute. Your infrastructure layer just needs to provide a concrete implementation for your database, like this one for Drizzle/Postgres:

```typescript
// apps/finance-api/src/infra/persistence/postgres/uow.postgres.ts
import { UnitOfWork } from "ddd-kit";
import { db } from "./db";

export const PostgresUoW: UnitOfWork = {
  async withTransaction<T>(fn: (tx: any) => Promise<T>): Promise<T> {
    return db.transaction(async (tx) => fn(tx));
  },
};
```