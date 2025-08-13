import type { UnitOfWork } from "../infra/unit-of-work";
import type { IdempotencyStore } from "../infra/idempotency-store";

/** Provide your own stable hash function (e.g., sha256). */
export type Hasher = (s: string) => string;

/**
 * IdempotencyConfigOptions<T>
 * ---------------------------
 * Per-call configuration for idempotent commands.
 *
 * key:
 *   - string: idempotency enabled
 *   - null:   idempotency explicitly disabled (forces the caller to be intentional)
 *
 * command:
 *   Human-readable command name (e.g., "CreateOrder") used in storage keys.
 *
 * scope:
 *   Small namespace to avoid cross-tenant collisions (e.g., { userId }).
 *
 * payload:
 *   Canonical payload used to detect "same command" retries.
 *
 * toResponse / reviveOnHit:
 *   Control how results are serialized and revived from the store.
 *   Defaults are identity/cast, which is fine if your result is simple JSON.
 *
 * clock:
 *   Override for testing predictable timestamps.
 */
export type IdempotencyConfigOptions<T> = {
  key: string | null;
  command: string;
  scope: Record<string, string>;
  payload: unknown;
  toResponse?: (value: T) => unknown;
  reviveOnHit?: (response: unknown) => T;
  clock?: { now(): Date };
};

/**
 * IdempotencyInfra
 * ----------------
 * Runtime dependencies to make idempotency work:
 * - uow: transaction runner
 * - store: idempotency persistence
 * - hash: stable hashing (sha256 recommended)
 */
export type IdempotencyInfra = {
  uow: UnitOfWork;
  store: IdempotencyStore;
  hash: Hasher;
};
