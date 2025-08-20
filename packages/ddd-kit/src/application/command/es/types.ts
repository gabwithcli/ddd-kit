/**
 * ES (Event Sourcing) Blueprint Types
 * -----------------------------------
 * Use these when your aggregate is persisted by appending events.
 * The runner composes:
 *   PREP (load history) -> CHECK (policies) -> EXEC (new events) -> APPEND -> PUB
 */

import type { Tx } from "../../../infra/unit-of-work";
import type { Result } from "../../../shared/result";
import type { DomainEvent } from "../types";

/**
 * load:
 *   Read the aggregate's past events (or snapshot+tail) and current revision.
 *   expectedRevision is used to enforce optimistic concurrency on append.
 */
export type EsLoader<TCmd, TEnv> = (args: {
  tx: Tx;
  env: TEnv;
  cmd: TCmd;
}) => Promise<{
  events: DomainEvent[];
  revision: bigint | number | "no_stream";
}>;

/**
 * run:
 *   Given the past events, derive the new events the command should append.
 *   Also compute a response DTO for the caller.
 */
export type EsRunner<TCmd, TEnv, TOut> = (args: {
  past: DomainEvent[];
  env: TEnv;
  cmd: TCmd;
  tx: Tx;
}) => Promise<
  Result<{
    toAppend: DomainEvent[];
    response: TOut;
  }>
>;

/**
 * append:
 *   Persist the new events with optimistic concurrency (expectedRevision).
 */
export type EsAppender<TCmd, TEnv> = (args: {
  env: TEnv;
  cmd: TCmd;
  tx: Tx;
  toAppend: DomainEvent[];
  expectedRevision: bigint | number | "no_stream";
}) => Promise<void>;

/**
 * publish (optional):
 *   Emit events to your bus, if needed (outbox, pub/sub, etc.).
 */
export type EsPublisher = (events: DomainEvent[], tx: Tx) => Promise<void>;
