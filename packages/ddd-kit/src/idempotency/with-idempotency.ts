import type { Tx } from "../infra/unit-of-work";
import { ok, type Result } from "../shared/result";
import type { IdempotencyConfigOptions, IdempotencyInfra } from "./types";

/**
 * withIdempotency
 * ---------------
 * Wrap a command execution so retries return the same result instead of
 * performing the action again.
 *
 * Flow:
 * 1) If options.key is null → skip idempotency; just run inside a transaction.
 * 2) Else:
 *    a) tryClaim:
 *        - if {response} → return it (short-circuit, no side-effects)
 *        - if "claimed"  → proceed to run the command
 *    b) run(tx) → your real command logic (returns Result<T>)
 *    c) if ok → saveResponse with a canonical object; return result
 *       if err → return error (we don't cache failures)
 */
export async function withIdempotency<T>(
  config: { options: IdempotencyConfigOptions<T> },
  infra: IdempotencyInfra,
  run: (tx: Tx) => Promise<Result<T>>
): Promise<Result<T>> {
  const { options } = config;
  const { uow, store, hash } = infra;

  // Fast path: no idempotency
  if (options.key === null) {
    return uow.withTransaction(run);
  }

  // Compute hashes (small stable strings) to scope and identify "same" payloads.
  const now = options.clock?.now() ?? new Date();
  const scopeHash = hash(JSON.stringify(options.scope));
  const payloadHash = hash(JSON.stringify(options.payload));

  return uow.withTransaction(async (tx) => {
    // Step a) Claim or short-circuit if result exists
    const claimed = await store.tryClaim({
      key: options.key!,
      command: options.command,
      scopeHash,
      payloadHash,
      now,
      tx,
    });

    if (claimed !== "claimed") {
      // Cached response → build the value and return
      const revive = options.reviveOnHit ?? ((r: unknown) => r as T);
      return ok(revive(claimed.response));
    }

    // Step b) Execute the real work
    const res = await run(tx);
    if (!res.ok) return res; // On failure, do not cache

    // Step c) Canonicalize and persist the response for future retries
    const toResp = options.toResponse ?? ((v: T) => v);
    await store.saveResponse({
      key: options.key!,
      command: options.command,
      scopeHash,
      response: toResp(res.value),
      tx,
    });

    return res;
  });
}
