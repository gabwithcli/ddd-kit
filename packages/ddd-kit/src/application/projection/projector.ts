// File: packages/ddd-kit/src/application/projection/projector.ts

import type { AggregateEvents } from "../../domain";
import type { Tx } from "../../infra";
import type { DomainEvent } from "../command";

/**
 * A conditional type that creates a union of all event classes.
 * - If `AggregateEvents` is augmented by the app, it becomes a specific union (e.g., EventA | EventB).
 * - If not (i.e., inside ddd-kit), it defaults to the safe base type `DomainEvent<any>`.
 */
export type AllEventUnion = keyof AggregateEvents extends never
  ? DomainEvent<any>
  : AggregateEvents[keyof AggregateEvents];

/**
 * A conditional type for event type names (strings).
 * - If `AggregateEvents` is augmented, it becomes a union of string literals (e.g., 'EventA_V1' | 'EventB_V1').
 * - If not, it defaults to the generic `string`.
 */
export type KnownEventTypes = keyof AggregateEvents extends never
  ? string
  : keyof AggregateEvents;

/**
 * Defines the contract for a Projector.
 * This version is now robustly typed to work both within the library and in the consuming application.
 */
export interface IProjector {
  /**
   * A list of the event types this projector is interested in.
   * In the consuming app, this will provide autocompletion for all known event types.
   */
  subscribesTo: KnownEventTypes[];

  /**
   * Processes a batch of relevant domain events to update the read model.
   */
  project(events: AllEventUnion[], tx: Tx): Promise<void>;
}
