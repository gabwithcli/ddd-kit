import { deepEqual } from "node:assert";
import type { DomainEvent } from "../application/command";

/**
 * re-export DomainInvariantError and other shared errors,
 * so apps can just write:
 *
 * import { AggregateRoot, DomainInvariantError } from "@acme/ddd-kit/domain";
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

// Using a branded type for IDs.
// This allows you to create distinct ID types like AggregateId<"RealEstate">
// or AggregateId<"Order">, which are not interchangeable. This prevents a
// whole class of bugs at compile time.
export type AggregateId<T extends string> = string & { readonly __brand: T };

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
export abstract class Entity<Id extends string = AggregateId<any>> {
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
export abstract class AggregateRoot<Id extends string = AggregateId<any>>
  extends Entity<Id>
  implements HasVersion
{
  public version = 0;

  // In-memory event buffer; handlers drain with pullEvents()
  protected readonly _events: Array<DomainEvent> = [];

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
   *
   * (with simplified comments for clarity below)
   *
   */
  pullEvents() {
    // 1. Make a copy of the letters to give to the postman. (Copy the events to be returned)
    const out = [...this._events];
    // 2. Immediately empty the mailbox so the letters can't be collected again. (handle the clearing of the events)
    this.clearEvents();
    // 3. Hand the copied letters to the postman.
    return out;
  }

  /**
   * Clears the in-memory event buffer.
   * This is a private implementation detail to ensure that once events are pulled,
   * they are not processed again.
   */
  private clearEvents() {
    this._events.length = 0;
  }
}
