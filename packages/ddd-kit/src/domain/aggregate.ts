import { deepEqual } from "node:assert";
import type { DomainEvent } from "../application/command";

/**
 * re-export DomainInvariantError and other shared errors,
 * so apps can just write:
 *
 * import { AggregateRoot, DomainInvariantError } from "ddd-kit/domain";
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
 * Helper function to create a properly typed AggregateId from a string.
 * This ensures type safety without requiring type assertions (as).
 *
 * @example Basic usage
 * const orderId = createAggregateId<"Order">("ord_123");
 *
 * @example With auto-prefixing
 * const orderId = createAggregateId<"Order">("123", "ord");
 */
export function createAggregateId<T extends string>(
  id: string,
  prefix?: string
): AggregateId<T> {
  // If prefix is provided and id doesn't already start with it, add the prefix
  const finalId =
    prefix && !id.startsWith(`${prefix}_`) ? `${prefix}_${id}` : id;

  return finalId as AggregateId<T>; // Type assertion is encapsulated in this helper
}

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
 * - Guards invariants for the whole aggregate, as the only entry point for state changes.
 * - Enforces the "Raise/Apply" pattern:
 * -> Command methods validate and `raise` events, but do not mutate state directly.
 * -> State mutations are centralized in a single `apply` method.
 * - Buffers domain events to support ES, outbox, and telemetry.
 */
export abstract class AggregateRoot<Id extends string = AggregateId<any>>
  extends Entity<Id>
  implements HasVersion
{
  public version = 0;

  // The in-memory event buffer now stores the full DomainEvent object,
  // including the `meta` property.
  protected readonly _events: Array<DomainEvent<unknown>> = [];

  /**
   * The core of our state transition logic.
   * This abstract method MUST be implemented by concrete aggregates. It will
   * contain a switch statement to handle each possible event type and
   * apply the necessary state changes.
   * @param event The domain event to apply to the aggregate.
   */
  protected abstract apply(event: DomainEvent<unknown>): void;

  /**
   * Raises a new domain event.
   * This is the one-and-only way for a command method to enact a state change.
   * It orchestrates the two critical steps:
   * 1. Calls `apply(event)` to mutate the aggregate's in-memory state.
   * 2. Pushes the event to the internal buffer to be persisted.
   * @param event The domain event being raised.
   */
  protected raise(event: DomainEvent<unknown>) {
    // First, we apply the event to ourself to change the current state.
    this.apply(event);

    // Then, we buffer the event so the application layer can persist it.
    this._events.push(event);
  }

  /**
   * Drain and return pending domain events.
   * This method's functionality remains the same. The repository calls it
   * to get the list of "new" events that need to be saved.
   */
  public pullEvents() {
    const out = [...this._events];
    this.clearEvents();
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
