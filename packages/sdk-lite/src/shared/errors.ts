// ## File: packages/sdk-lite/src/shared/errors.ts

import { z } from "zod";

/**
 * DomainInvariantError
 * --------------------
 * Throw this from your **domain** or **policy** code when business rules are violated.
 * Example: "Order must have at least one item" or "Vendor is blocked".
 *
 * Why a custom error?
 * - Lets the HTTP layer map it to 422 Unprocessable Entity (semantic error).
 * - Keeps business rules clearly identified and separate from infrastructure issues.
 */
export class DomainInvariantError extends Error {
  /** Stable error code that clients/tests can rely on. */
  public readonly code = "DOMAIN_INVARIANT_VIOLATION";

  constructor(message: string, public readonly details?: unknown) {
    super(message);
    this.name = "DomainInvariantError";
  }
}

/**
 * EdgeError
 * ---------
 * These are error shapes typically produced at the **request/edge** layer,
 * before domain logic runs (auth, parsing, schema validation).
 * Your HTTP responder will translate them into status codes.
 */
export type EdgeError =
  | { kind: "Unauthorized"; message?: string }
  | { kind: "BadRequest"; message: string; details?: unknown }
  | { kind: "NotFound"; entity?: string; id?: string }
  | { kind: "InvariantViolation"; message: string; details?: unknown }
  | { kind: "Conflict"; message: string }
  | { kind: "Infrastructure"; message: string };

