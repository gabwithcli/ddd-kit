// ddd-kit/src/domain/invariants.ts
// -----------------------------------------------------------------------------
// Invariant DSL for aggregates (domain-only, no I/O)
//
// Why this exists
// ---------------
// - Invariants are the "always true" rules of an aggregate's internal state.
// - We want them *inside* the domain, but written in a way that's readable
//   ("English-like") and returns *structured* information for the edge layer.
// - We accumulate *all* violations and throw once, so the UI can show a rich
//   error (e.g., multiple fields invalid) without trial-and-error.
// - We reuse the platform's canonical DomainInvariantError so HTTP mappers,
//   logs, and tests stay consistent across the codebase.
//
// What this is NOT
// ----------------
// - This is not for external/contextual checks (e.g., plan limits, flags,
//   uniqueness across the DB). Those belong to application-level *policies*.
//   Keep a clean separation: "intrinsic rules" (invariants) vs "context rules"
//   (policies).
//
// Typical usage
// -------------
//   invariants({ aggregate: "RealEstate", operation: "create" })
//     .ensure("Name is required.", "real_estate.name_required", name.trim() !== "", { name })
//     .ensure("Purchase currency must match baseCurrency.", "real_estate.currency_matches", purchase.currency === baseCurrency,
//             { purchaseCurrency: purchase.currency, baseCurrency })
//     .must("Purchase date must be a valid ISO-8601 date.", "real_estate.purchase_date_valid",
//           () => !Number.isNaN(Date.parse(purchase.date)), { purchaseDate: purchase.date })
//     .throwIfAny("RealEstate.Invalid");
// -----------------------------------------------------------------------------

import { DomainInvariantError } from "../shared/errors";

// A single invariant failure, with a readable message and a stable key for i18n/tests.
// "details" are free-form structured data useful for debugging and telemetry.
export type InvariantViolation = {
  message: string; // e.g. "Name is required."
  key: string; // e.g. "real_estate.name_required"
  details?: Record<string, unknown>;
};

// Shape of the error.details payload we attach to DomainInvariantError.
// "violations" is what UIs typically render; "context" adds high-level info.
export type InvariantErrorDetails = {
  violations: InvariantViolation[]; // all collected violations
  context?: Record<string, unknown>; // optional: aggregate id, op, etc.
};

/**
 * Build an invariant collector
 * - Use `.ensure` when you already have a boolean condition
 * - Use `.must` when you want lazy evaluation (we wrap try/catch)
 * - Call `.throwIfAny()` once at the end to throw a single DomainInvariantError
 *
 * @param context optional structured info included in `error.details.context`
 */
export function invariants(context?: Record<string, unknown>) {
  // Internal buffer of violations (we don't throw immediately).
  const violations: InvariantViolation[] = [];

  // Push a violation into the buffer with a readable message, a stable key,
  // and optional structured details (useful for logs and UIs).
  function push(
    message: string,
    key: string,
    details?: Record<string, unknown>
  ) {
    violations.push({ message, key, details });
  }

  /**
   * Ensure a condition that you've already evaluated.
   * Prefer this when expressing "simple truths" inline without lambdas.
   *
   * Example:
   *   .ensure("Name is required.", "real_estate.name_required", name.trim() !== "")
   */
  function ensure(
    message: string,
    key: string,
    condition: boolean,
    details?: Record<string, unknown>
  ) {
    if (!condition) push(message, key, details);
    return api;
  }

  /**
   * Ensure a condition that's best expressed as a function.
   * We catch exceptions and convert them into a structured violation,
   * preventing domain code from leaking stack traces to callers.
   *
   * Example:
   *   .must("Purchase date must be ISO-8601.", "purchase_date_valid", () => !Number.isNaN(Date.parse(purchase.date)))
   */
  function must(
    message: string,
    key: string,
    predicate: () => boolean,
    details?: Record<string, unknown>
  ) {
    try {
      const ok = !!predicate();
      if (!ok) push(message, key, details);
    } catch (err) {
      // Convert unexpected predicate errors into a violation with extra context
      push(message, `${key}.exception`, {
        ...details,
        error: (err as Error)?.message,
      });
    }
    return api;
  }

  /**
   * Throw a single DomainInvariantError if any violation was recorded.
   * - Message is compact (first violation + a "+N more" suffix) so logs stay tidy.
   * - The full list lives in `error.details.violations`.
   * - By default, DomainInvariantError.code is "DOMAIN_INVARIANT_VIOLATION";
   *   pass a custom code to override it for finer-grained client handling.
   */
  function throwIfAny(customCode?: string) {
    if (violations.length === 0) return;

    // Compact, human-friendly message for logs:
    const first = violations[0]?.message ?? "Domain invariant(s) violated";
    const suffix =
      violations.length > 1 ? ` (+${violations.length - 1} more)` : "";
    const message = `${first}${suffix}`;

    const details: InvariantErrorDetails = { violations, context };
    const err = new DomainInvariantError(message, details);

    // Optional override (non-breaking): allow domain code to set a more specific code.
    if (customCode) (err as any).code = customCode;

    throw err;
  }

  /**
   * Expose collected violations without throwing.
   * Handy for "dry-run" validations in tests or pre-checks.
   */
  function toArray() {
    return violations;
  }

  const api = { ensure, must, throwIfAny, toArray };
  return api;
}

/**
 * Userland type guard for narrowing unknown errors in adapters/tests
 * without importing the class in every file. Also works with errors thrown
 * by this DSL, which attach `details.violations`.
 */
export function isDomainInvariantError(
  e: unknown
): e is DomainInvariantError & { details?: InvariantErrorDetails } {
  return (
    !!e &&
    typeof e === "object" &&
    (e as any).name === "DomainInvariantError" &&
    typeof (e as any).code === "string"
  );
}
