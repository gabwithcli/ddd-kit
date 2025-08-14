import { err, ok, type Result } from "../../shared/result";

/**
 * A Policy is a small function that checks a single rule.
 * - If the rule is satisfied → return ok(true)
 * - If the rule is violated → return err(someErrorPayload) OR throw a DomainInvariantError
 *
 * Keep policies tiny and focused. Chain several to cover all invariants.
 */
export type Policy<TEnv, TCmd> = (args: {
  env: TEnv; // your injected deps (repos, read models, caches)
  cmd: TCmd; // the command DTO
}) => Promise<Result<true>> | Result<true>;

/**
 * Combine multiple policies into one.
 * - Evaluates in order
 * - Returns first error encountered
 * - Short-circuits on error
 */
export function allPolicies<TEnv, TCmd>(
  policies: Policy<TEnv, TCmd>[]
): Policy<TEnv, TCmd> {
  return async ({ env, cmd }) => {
    for (const p of policies) {
      const r = await p({ env, cmd });
      if (!r.ok) return r;
    }
    return ok(true);
  };
}

/**
 * A tiny helper to adapt a boolean predicate into a Policy.
 * Example:
 *    predicatePolicy("Must have items", () => items.length > 0)
 */
export function predicatePolicy<TEnv, TCmd>(
  message: string,
  predicate: (args: { env: TEnv; cmd: TCmd }) => boolean | Promise<boolean>
): Policy<TEnv, TCmd> {
  return async (args) =>
    (await predicate(args)) ? ok(true) : err({ message });
}
