/**
 * Common types for command execution across storage styles.
 *
 * This layer is deliberately small, so apps only provide the minimum needed:
 * - How to load the aggregate (or its events)
 * - How to check domain policies (invariants)
 * - How to apply the command to produce either:
 *      CRUD: new aggregate state (plus optional events)
 *      ES:   new events (plus optional projected value)
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

/** Basic event type for cross-domain helpers. Keep it serializable. */
export type DomainEvent = {
  type: string;
  data: unknown;
  meta?: Record<string, unknown>;
};

/** Optional publisher port */
export interface EventPublisher {
  publish(events: DomainEvent[], tx: Tx): Promise<void>;
}
