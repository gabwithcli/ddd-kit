// packages/sdk-lite/src/application/repos/abstract.crud.repository.ts

import type { AggregateRoot } from "../../domain";
import type { Tx } from "../../infra";
import { DomainEvent } from "../command";
import type { AggregateRepository } from "./aggregate.repository";

/**
 * An abstract base class for CRUD-style repositories that implements the
 * common logic for saving an aggregate.
 *
 * This class uses the Template Method Pattern. It provides the concrete `save`
 * method, which orchestrates the persistence logic by calling abstract methods
 * (`insert` and `update`) that must be implemented by the subclasses.
 *
 * @template AR - The type of Aggregate Root this repository manages.
 */
export abstract class AbstractCrudRepository<AR extends AggregateRoot>
  implements AggregateRepository<AR>
{
  /**
   * The main entry point for persisting an aggregate.
   * It checks the aggregate's version to determine if it's a new entity
   * (version 0) or an existing one, then delegates to the appropriate
   * protected method (`insert` or `update`).
   *
   * Subclasses do not need to implement this method.
   *
   * @param tx - The transaction context.
   * @param agg - The aggregate instance to save.
   */
  public async save(tx: Tx, agg: AR): Promise<DomainEvent<unknown>[]> {
    if (agg.version === 0) {
      await this.insert(tx, agg);
    } else {
      await this.update(tx, agg);
    }
    // Pull and return the events after the insert/update operation.
    return agg.pullEvents();
  }

  /**
   * Finds an aggregate by its unique identifier.
   * Must be implemented by the concrete repository to handle the
   * specific database query and data-to-domain mapping (rehydration).
   *
   * @abstract
   * @param tx - The transaction context.
   * @param id - The ID of the aggregate to find.
   * @returns A promise resolving to the aggregate or null if not found.
   */
  abstract findById(tx: Tx, id: string): Promise<AR | null>;

  /**
   * Inserts a new aggregate into the database.
   * Must be implemented by the concrete repository to handle the
   * `INSERT` logic and mapping from the domain to the database schema.
   * After a successful insert, the aggregate's version should be set to 1.
   *
   * @abstract
   * @protected
   * @param tx - The transaction context.
   * @param agg - The new aggregate to insert.
   */
  protected abstract insert(tx: Tx, agg: AR): Promise<void>;

  /**
   * Updates an existing aggregate in the database.
   * Must be implemented by the concrete repository to handle the
   * `UPDATE` logic, including optimistic concurrency checks using the
   * aggregate's version. After a successful update, the version should
   * be incremented.
   *
   * @abstract
   * @protected
   * @param tx - The transaction context.
   * @param agg - The existing aggregate to update.
   */
  protected abstract update(tx: Tx, agg: AR): Promise<void>;
}
