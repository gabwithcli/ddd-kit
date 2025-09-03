/**
 * Common types for command execution across storage styles.
 *
 * This layer is deliberately small, so apps only provide the minimum needed:
 * - How to load the aggregate (or its events)
 * - How to check domain policies (invariants)
 * - How to apply the command to produce either:
 * CRUD: new aggregate state (plus optional events)
 * ES:   new events (plus optional projected value)
 * - How to persist (save state or append events)
 * - How to publish events (optional)
 */

import type { Tx } from "../../infra/unit-of-work";
import type { Result } from "../../shared/result";

/** A small identity map if you need it; most apps won’t. */
export type Context = Record<string, unknown>;

/** Represents the input that reaches the command executor (your DTO). */
export type CommandInput = Record<string, unknown>;

/** Policy check result – you can return ok/err, or just throw DomainInvariantError in policies. */
export type PolicyResult = Result<true, unknown>;

/** The required, non-negotiable properties of our event metadata. */
type EventMeta = {
  version: number;
  timestamp: Date;
  [key: string]: unknown;
};

/**
 * A plain object representation of a domain event, useful for serialization.
 */
export type DomainEventObject<T = unknown> = {
  type: string;
  data: T;
  meta: EventMeta;
};

/**
 * An abstract base class for creating rich, class-based domain events.
 * It automatically handles metadata and provides a clear structure.
 * @template T - The type of the event's data payload.
 */
export abstract class DomainEvent<T> {
  // Each concrete event MUST define its type.
  public abstract readonly type: string;
  // The metadata is handled by the base class.
  public readonly meta: EventMeta;

  constructor(
    // The data payload for the event.
    public readonly data: T,
    meta?: { version?: number; timestamp?: Date }
  ) {
    this.meta = {
      version: meta?.version ?? 1,
      timestamp: meta?.timestamp ?? new Date(),
    };
  }
}

/** Optional publisher port */
export interface EventPublisher {
  publish(events: DomainEvent<unknown>[], tx: Tx): Promise<void>;
}
