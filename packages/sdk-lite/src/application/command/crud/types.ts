/**
 * CRUD Blueprint Types
 * --------------------
 * Use these when your aggregate is persisted as rows/documents (classic CRUD).
 * The runner composes the pipeline:
 *   PREP (load) -> CHECK (policies) -> EXEC (run) -> SAVE (persist) -> PUB (optional)
 */

import type { Tx } from "../../../infra/unit-of-work";
import type { Result } from "../../../shared/result";
import type { DomainEvent } from "../types";

/**
 * load:
 *   Load the current aggregate (or null for creations).
 *   Use the provided Tx to ensure any reads happen inside the same unit of work.
 */
export type CrudLoader<TAgg, TCmd, TEnv> = (args: {
  tx: Tx;
  env: TEnv;
  cmd: TCmd;
}) => Promise<TAgg>;

/**
 * run:
 *   Apply the command to the aggregate and produce:
 *     - next: the next aggregate state to persist
 *     - response: DTO you’ll return to the caller
 *     - events?: optional domain events to publish
 */
export type CrudRunner<TAgg, TCmd, TEnv, TOut> = (args: {
  current: TAgg;
  env: TEnv;
  cmd: TCmd;
  tx: Tx;
}) => Promise<
  Result<{
    next: TAgg;
    response: TOut;
    events?: DomainEvent[];
  }>
>;

/**
 * save:
 *   Persist the next aggregate state using the same Tx.
 */
export type CrudSaver<TAgg, TEnv> = (args: {
  next: TAgg;
  env: TEnv;
  tx: Tx;
}) => Promise<void>;

/**
 * publish (optional):
 *   Send events to your bus. If you don’t need events, skip it.
 */
export type CrudPublisher = (events: DomainEvent[], tx: Tx) => Promise<void>;
