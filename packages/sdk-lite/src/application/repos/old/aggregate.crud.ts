/**
 * CRUD repository port for aggregates.
 * Concrete adapters (e.g., Drizzle, Prisma) implement this for each aggregate type.
 *
 * Contract:
 * - load(tx, id): returns the *fully rehydrated* aggregate (root + children) or null.
 * - save(tx, agg): persists root + children and enforces optimistic concurrency.
 */
import type { AggregateRoot } from "../../../domain/aggregate";
import type { Tx } from "../../../infra/unit-of-work";

export interface AggregateCrudRepository<AR extends AggregateRoot> {
  load(tx: Tx, id: string): Promise<AR | null>;
  save(tx: Tx, agg: AR): Promise<void>;
}
