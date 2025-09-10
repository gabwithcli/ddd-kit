// ## File: packages/ddd-kit/src/domain/aggregate.ts

import { deepEqual } from "node:assert";
import type { DomainEvent } from "../application/command";

/**
 * Re-exports DomainInvariantError and other shared errors from the shared folder.
 * This is a quality-of-life improvement that allows consuming applications to import
 * core domain concepts from a single, consistent location.
 *
 * Example:
 * import { AggregateRoot, DomainInvariantError } from "ddd-kit/domain";
 */
export * from "../shared/errors";

// --- Core DDD Primitives ---

/**
 * A branded type for creating distinct, non-interchangeable Aggregate IDs.
 * By "branding" the string with a generic type `T`, TypeScript can differentiate
 * between `AggregateId<"Order">` and `AggregateId<"RealEstate">`, preventing you
 * from accidentally using one where the other is expected. This is a powerful
 * compile-time safety feature.
 */
export type AggregateId<T extends string> = string & { readonly __brand: T };

/**
 * A factory function to create a properly typed `AggregateId` from a raw string.
 * It encapsulates the type assertion, providing a safe and clear way to construct IDs.
 * It also includes an optional prefixing logic, which is a common practice for making
 * IDs more readable and globally unique (e.g., "ord_12345").
 *
 * @param id The raw unique identifier (e.g., a ULID or UUID).
 * @param prefix A short string to prepend to the ID (e.g., "re" for Real Estate).
 * @returns A strongly-typed, branded AggregateId.
 */
export function createAggregateId<T extends string>(
  id: string,
  prefix?: string
): AggregateId<T> {
  // If a prefix is provided and the ID doesn't already have it, we add it.
  const finalId =
    prefix && !id.startsWith(`${prefix}_`) ? `${prefix}_${id}` : id;

  // The type assertion is safely contained within this function.
  return finalId as AggregateId<T>;
}

/**
 * An interface marking an object as having a version number.
 * This is crucial for implementing optimistic concurrency control, a pattern that
 * prevents two users from overwriting each other's changes.
 * - In a CRUD system, this typically maps to a `version` column in a database table.
 * - In an Event Sourcing system, this corresponds to the event number or stream revision.
 */
export interface HasVersion {
  version: number;
}

/**
 * The base class for an Entity.
 * An Entity is an object defined not by its attributes, but by its unique identity.
 * It has an `id` that remains constant throughout its lifecycle. For example, a "Person"
 * is an Entity; they can change their name or address, but they are still the same person.
 */
export abstract class Entity<Id extends string = AggregateId<any>> {
  constructor(public readonly id: Id) {}
}

/**
 * The base class for a Value Object.
 * A Value Object is an immutable object defined by its attributes, not a unique identity.
 * Two Value Objects are considered equal if all their properties are the same.
 * For example, an "Address" or "Money" are Value Objects. A €50 note is interchangeable
 * with any other €50 note.
 */
export abstract class ValueObject<T extends object> {
  // The constructor is protected to enforce creation through static factory methods (e.g., `Address.from(...)`).
  protected constructor(public readonly props: Readonly<T>) {}

  /**
   * Compares this Value Object to another for equality.
   * It performs a deep equality check on the `props` object, ensuring that nested
   * properties are also compared.
   *
   * @param other The other Value Object to compare against.
   * @returns `true` if the Value Objects are equal, `false` otherwise.
   */
  equals(other: ValueObject<T>): boolean {
    try {
      // We use Node.js's robust deepEqual for a reliable structural comparison.
      deepEqual(this.props, other.props);
      return true;
    } catch {
      return false;
    }
  }
}

// --- Module Augmentation and Event Typing ---

/**
 * This is the "socket" for module augmentation. It's an empty interface by design.
 * Consuming applications (like `finance-api`) will augment this interface to "plug in"
 * their own specific event types. This allows `ddd-kit` to be strongly typed with
 * application-specific events without ever knowing they exist.
 */
export interface AggregateEvents {
  // Initially empty. Augmented by the consumer application.
  // Example augmentation in `finance-api`:
  // 'RealEstateAssetCreated_V1': RealEstateAssetCreated;
}

/**
 * A helper type that creates a discriminated union of all event classes defined
 * in the augmented `AggregateEvents` interface.
 * If `AggregateEvents` has not been augmented, it safely defaults to `DomainEvent<unknown>`.
 */
export type EventUnion<T extends keyof AggregateEvents> = T extends any
  ? AggregateEvents[T]
  : DomainEvent<unknown>;

// --- Aggregate Root ---

/**
 * The base class for an Aggregate Root.
 * The Aggregate Root is the main entry point for all modifications within an aggregate.
 * It acts as a transactional boundary and a guardian for all business rules (invariants)
 * for the objects it contains (Entities and Value Objects).
 */
export abstract class AggregateRoot<
    Id extends string = AggregateId<any>,
    // The AggregateRoot is now generic over the events it can handle.
    // This allows a specific aggregate, like `RealEstateAggregate`, to declare
    // exactly which events it's concerned with, providing strong type safety.
    TAllEvents extends keyof AggregateEvents = keyof AggregateEvents
  >
  extends Entity<Id>
  implements HasVersion
{
  /**
   * The current version of the aggregate, used for optimistic concurrency control.
   * A new, in-memory aggregate starts at version 0.
   */
  public version = 0;

  /**
   * An in-memory buffer that stores domain events that have been raised but not yet
   * persisted. This buffer is now strongly typed using the `EventUnion` helper.
   */
  protected readonly _events: Array<EventUnion<TAllEvents>> = [];

  /**
   * Raises a new domain event, which is the sole mechanism for enacting a state change.
   * This method orchestrates the "Raise/Apply" pattern.
   *
   * @param event The strongly-typed domain event to be raised.
   */
  protected raise(event: EventUnion<TAllEvents>) {
    // 1. First, we apply the event to ourself to mutate the current in-memory state.
    this.apply(event);

    // 2. Then, we buffer the event so the application layer (e.g., a repository) can persist it.
    this._events.push(event);
  }

  /**
   * This is the private event dispatcher. It now ensures that a handler method
   * exists for every event that is raised. If a handler is missing, it throws a
   * descriptive error to prevent state inconsistencies.
   *
   * @param event The strongly-typed domain event to be dispatched.
   * @throws {Error} If a corresponding `apply<EventType>` method is not found on the concrete aggregate.
   */
  protected apply(event: EventUnion<TAllEvents>): void {
    const handlerMethodName = `apply${event.type}`;
    const handler = this[handlerMethodName as keyof this];

    if (typeof handler === "function") {
      // The handler was found, so we call it to apply the state change.
      handler.call(this, event);
    } else {
      // CRITICAL: The handler was not found. This is a developer error.
      // We throw a loud, descriptive error to fail fast and make the
      // problem immediately obvious.
      throw new Error(
        `Missing apply method: The aggregate '${this.constructor.name}' is missing a handler for the event '${event.type}'. ` +
          `Please implement the following method: protected ${handlerMethodName}(event: ${event.constructor.name})`
      );
    }
  }

  /**
   * Drains and returns the pending domain events from the internal buffer.
   * The repository calls this method after a successful business operation to get
   * the list of events that need to be saved to the database or published to a message bus.
   *
   * @returns An array of the pending domain events.
   */
  public pullEvents() {
    // We create a copy of the events array to return.
    const out = [...this._events];
    // We then clear the internal buffer to prevent the same events from being processed twice.
    this.clearEvents();
    return out;
  }

  /**
   * A private helper method to clear the in-memory event buffer.
   */
  private clearEvents() {
    this._events.length = 0;
  }
}
