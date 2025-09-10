// ## File: packages/ddd-kit/src/shared/errors.ts

/**
 * A constant array holding all possible kinds of EdgeErrors.
 * This is the single source of truth for the entire error system.
 */
export const EDGE_ERROR_KINDS = [
  "Unauthorized",
  "BadRequest",
  "NotFound",
  "InvariantViolation",
  "Conflict",
  "Infrastructure",
] as const;

// We infer the union type of kind strings directly from our constant array.
type EdgeErrorKind = (typeof EDGE_ERROR_KINDS)[number];

export class DomainInvariantError extends Error {
  /** Stable error code that clients/tests can rely on. */
  public readonly code = "DOMAIN_INVARIANT_VIOLATION";

  constructor(message: string, public readonly details?: unknown) {
    super(message);
    this.name = "DomainInvariantError";
  }
}

/**
 * This is a "map" that defines the unique properties for each kind of error.
 * For example, a 'NotFound' error has optional 'entity' and 'id' fields,
 * while 'Unauthorized' has only an optional 'message'.
 */
type EdgeErrorPayloads = {
  Unauthorized: { message?: string };
  BadRequest: { message: string; details?: unknown };
  NotFound: { entity?: string; id?: string };
  InvariantViolation: { message: string; details?: unknown };
  Conflict: { message: string };
  Infrastructure: { message: string };
};

/**
 * EdgeError
 * This is the final, programmatically generated discriminated union.
 * Here's how it works:
 * 1. `[K in EdgeErrorKind]`: We iterate over each string in our `EdgeErrorKind` union (e.g., "Unauthorized", "BadRequest").
 * 2. `{ kind: K } & EdgeErrorPayloads[K]`: For each kind `K`, we create an object type. It has a `kind` property with the literal type `K`, and we merge (`&`) the corresponding payload from our `EdgeErrorPayloads` map.
 * 3. `[EdgeErrorKind]`: This final step takes all the generated object types and turns them into a single union type.
 *
 * The result is identical to writing it out by hand, but now it's generated automatically from our single source of truth.
 */
export type EdgeError = {
  [K in EdgeErrorKind]: { kind: K } & EdgeErrorPayloads[K];
}[EdgeErrorKind];
