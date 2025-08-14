import { deepEqual } from "node:assert";

/**
 * re-export DomainInvariantError and other shared errors,
 * so apps can just write:
 *
 * import { AggregateRoot, DomainInvariantError } from "@acme/sdk-lite/domain";
 *
 */
export * from "../shared/errors"; // re-export DomainInvariantError (and other shared errors)

/**
 * DDD tactical patterns in lightweight TypeScript.
 *
 * Why this exists:
 * - We want domain rules to live *in the model*, not in controllers or handlers.
 * - Aggregates provide a transactional consistency boundary. All writes flow through the root.
 * - Storage-agnostic: works with CRUD (ORM) or ES (event store) backends.
 */

export type AggregateId = string;

/**
 * Marker for optimistic concurrency control.
 * - CRUD: version = row_version (incremented per successful commit)
 * - ES:   version = last event position (or stream revision)
 */
export interface HasVersion {
  version: number;
}

/**
 * Base Entity: identified by id; equality by identity.
 * Keep this small: don’t leak infra concerns here.
 */
export abstract class Entity<Id extends AggregateId = AggregateId> {
  constructor(public readonly id: Id) {}
}

/**
 * Base Value Object: equality by value.
 * Implementation notes:
 * - We use Node.js assert.deepEqual for robust comparison.
 * - Props are readonly to encourage immutability.
 */
export abstract class ValueObject<T extends object> {
  protected constructor(public readonly props: Readonly<T>) {}
  equals(other: ValueObject<T>): boolean {
    try {
      deepEqual(this.props, other.props);
      return true;
    } catch {
      return false;
    }
  }
}

/**
 * AggregateRoot:
 * - Guards invariants for the whole aggregate.
 * - Only entry point for state changes (public methods).
 * - Buffers domain events to support ES, outbox, and telemetry.
 */
export abstract class AggregateRoot<Id extends AggregateId = AggregateId>
  extends Entity<Id>
  implements HasVersion
{
  public version = 0;

  // In-memory event buffer; handlers drain with pullEvents()
  private readonly _events: Array<{ type: string; data: unknown }> = [];

  /**
   * Record a domain event.
   * - In CRUD mode: you may publish these via outbox to keep analytics/read-sides in sync.
   * - In ES mode: these are what you append to the event store.
   */
  protected record(type: string, data: unknown) {
    this._events.push({ type, data });
  }

  /**
   * Drain and return pending domain events.
   * MUST be called by the application layer (command runner) after successful guards.
   */
  pullEvents() {
    const out = [...this._events];
    this._events.length = 0;
    return out;
  }
}
