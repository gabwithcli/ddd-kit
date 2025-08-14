/**
 * CRUD Command Runner
 * -------------------
 * A reusable pipeline for CRUD-based aggregates:
 *   1) load -> 2) policies -> 3) run -> 4) save -> 5) publish
 *
 * Works under any HTTP framework or even without HTTP.
 * Pair it with `withIdempotency` + `UnitOfWork` at the handler level.
 */

import type { Tx } from "../../../infra/unit-of-work";
import { err, ok, type Result } from "../../../shared/result";
import type { Policy } from "../policies";
import type { CrudLoader, CrudPublisher, CrudRunner, CrudSaver } from "./types";

export function makeCrudCommand<TEnv, TCmd, TAgg, TOut>(deps: {
  load: CrudLoader<TAgg, TCmd, TEnv>;
  run: CrudRunner<TAgg, TCmd, TEnv, TOut>;
  save: CrudSaver<TAgg, TEnv>;
  publish?: CrudPublisher;
  policies?: Policy<TEnv, TCmd>[];
}) {
  const combinedPolicy: Policy<TEnv, TCmd> | undefined =
    deps.policies && deps.policies.length
      ? async (args) => {
          for (const p of deps.policies!) {
            const r = await p(args);
            if (!r.ok) return r;
          }
          return ok(true);
        }
      : undefined;

  return async function execute(args: {
    tx: Tx;
    env: TEnv;
    cmd: TCmd;
  }): Promise<Result<TOut>> {
    // PREP: Load current aggregate (can be null for creations)
    const current = await deps.load({
      tx: args.tx,
      env: args.env,
      cmd: args.cmd,
    });

    // CHECK: Domain policies / invariants
    if (combinedPolicy) {
      const pr = await combinedPolicy({ env: args.env, cmd: args.cmd });
      if (!pr.ok) return err(pr.error);
    }

    // EXEC: Apply command
    const exec = await deps.run({
      current,
      env: args.env,
      cmd: args.cmd,
      tx: args.tx,
    });
    if (!exec.ok) return exec;

    // SAVE: Persist next state
    await deps.save({ next: exec.value.next, env: args.env, tx: args.tx });

    // PUB: Optionally publish events
    if (exec.value.events?.length && deps.publish) {
      await deps.publish(exec.value.events, args.tx);
    }

    // DONE: Return response DTO
    return ok(exec.value.response);
  };
}
