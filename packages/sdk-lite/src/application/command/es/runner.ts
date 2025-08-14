/**
 * ES Command Runner
 * -----------------
 * Reusable pipeline for event-sourced aggregates:
 *   1) load -> 2) policies -> 3) run -> 4) append -> 5) publish
 *
 * Use it under UnitOfWork + withIdempotency from the handler layer.
 */

import type { Tx } from "../../../infra/unit-of-work";
import { err, ok, type Result } from "../../../shared/result";
import type { Policy } from "../../policies";
import type { EsAppender, EsLoader, EsPublisher, EsRunner } from "./types";

export function makeEsCommand<TEnv, TCmd, TOut>(deps: {
  load: EsLoader<TCmd, TEnv>;
  run: EsRunner<TCmd, TEnv, TOut>;
  append: EsAppender<TCmd, TEnv>;
  publish?: EsPublisher;
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
    // PREP: read history + expected revision
    const loaded = await deps.load({
      tx: args.tx,
      env: args.env,
      cmd: args.cmd,
    });

    // CHECK: domain invariants
    if (combinedPolicy) {
      const pr = await combinedPolicy({ env: args.env, cmd: args.cmd });
      if (!pr.ok) return err(pr.error);
    }

    // EXEC: produce new events + response
    const exec = await deps.run({
      past: loaded.events,
      env: args.env,
      cmd: args.cmd,
      tx: args.tx,
    });
    if (!exec.ok) return exec;

    // SAVE: append new events with optimistic concurrency
    await deps.append({
      env: args.env,
      cmd: args.cmd,
      tx: args.tx,
      toAppend: exec.value.toAppend,
      expectedRevision: loaded.revision,
    });

    // PUB: optionally publish events
    if (exec.value.toAppend?.length && deps.publish) {
      await deps.publish(exec.value.toAppend, args.tx);
    }

    // DONE: return response DTO
    return ok(exec.value.response);
  };
}
