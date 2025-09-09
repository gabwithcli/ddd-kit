// File: packages/ddd-kit/src/application/projection/state-projector.ts
//
import { AggregateRoot } from "../../domain";
import { Tx } from "../../infra";

/**
 * Defines the contract for a projector that builds a read model
 * from the full state of an aggregate root.
 *
 * This is used in CRUD-based systems where the projection is triggered
 * directly after a successful save operation in the repository.
 */
export interface IStateProjector<T extends AggregateRoot> {
  project(aggregate: T, tx: Tx): Promise<void>;
}
