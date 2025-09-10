// packages/ddd-kit/src/application/repos/aggregate.repository.ts

import type { AggregateRoot } from "../../domain";
import type { Tx } from "../../infra";
import { DomainEvent } from "../command";

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
   * Persists the aggregate's state changes within a transaction and returns the events that were persisted.
   *
   * This method is responsible for saving the outcome of a business operation.
   * By returning the events, it provides a definitive record of what was saved,
   * which can then be reliably passed to an event publisher.
   *
   * @param tx - The transaction context to ensure atomicity.
   * @param agg - The aggregate instance with pending changes.
   * @returns A promise that resolves with an array of the domain events that were successfully persisted.
   */
  save(tx: Tx, agg: AR): Promise<DomainEvent<unknown>[]>;
}
