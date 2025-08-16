// packages/sdk-lite/src/application/repos/aggregate.repository.ts

import type { AggregateRoot } from "../../domain";
import type { Tx } from "../../infra";

/**
 * A universal port for aggregate persistence, abstracting over
 * both CRUD and Event Sourcing storage strategies.
 *
 * This interface acts as a contract that any repository, regardless of its
 * underlying storage mechanism, must fulfill. By programming against this
 * abstraction, our application layer (like the `CommandHandler`) becomes
 * completely decoupled from the persistence details.
 */
export interface AggregateRepository<AR extends AggregateRoot> {
  /**
   * Finds an aggregate by its unique identifier within a transaction.
   *
   * How implementations might differ:
   * - In a CRUD implementation, this will typically execute a `SELECT` query
   * on a table to fetch the aggregate's current state and rehydrate the object.
   * - In an Event Sourcing implementation, this method will read all events
   * from the aggregate's stream and replay them in order to reconstruct the
   * aggregate's current state in memory.
   *
   * @param tx - The transaction context to ensure read consistency.
   * @param id - The unique ID of the aggregate to find.
   * @returns A promise that resolves to the aggregate instance or null if not found.
   */
  findById(tx: Tx, id: string): Promise<AR | null>;

  /**
   * Persists the aggregate's state changes within a transaction.
   *
   * This method is responsible for saving the outcome of a business operation.
   *
   * How implementations might differ:
   * - In a CRUD implementation, this method will perform an `INSERT` for a new
   * aggregate or an `UPDATE` for an existing one. It must also handle
   * optimistic concurrency control, typically by checking a version number.
   * - In an Event Sourcing implementation, this method will retrieve the pending
   * domain events from the aggregate (using `aggregate.pullEvents()`) and append
   * them to the corresponding event stream, also using an expected version
   * for optimistic concurrency.
   *
   * @param tx - The transaction context to ensure atomicity.
   * @param agg - The aggregate instance with pending changes.
   * @returns A promise that resolves when the save operation is complete.
   */
  save(tx: Tx, agg: AR): Promise<void>;
}
