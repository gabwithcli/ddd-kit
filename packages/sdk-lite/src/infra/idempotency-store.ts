import type { Tx } from "./unit-of-work";

/**
 * IdempotencyStore
 * ----------------
 * Stores the canonical result of a command keyed by (key, scope, command).
 *
 * Why?
 * - If a client retries the same command (network issues, timeouts),
 *   we return the **same** result without doing the work twice.
 *
 * Guarantees expected from an implementation:
 * - tryClaim must be **atomic**:
 *     - If entry doesn't exist → create "claimed" placeholder (no response yet).
 *     - If entry exists with a response → return that response.
 *     - If entry exists without response → treat as "claimed" (in-flight).
 * - saveResponse stores the final canonical response for future retries.
 */
export interface IdempotencyStore {
  /**
   * Try to claim the key for this command+scope+payload.
   * Returns:
   * - "claimed" if we can proceed and compute the result now.
   * - { response } if the canonical result already exists → return it instead.
   */
  tryClaim(args: {
    key: string;
    command: string;
    scopeHash: string; // small namespace hash (e.g., { userId })
    payloadHash: string; // hash of canonical payload (what "same" means)
    now: Date;
    tx: Tx;
  }): Promise<"claimed" | { response: unknown }>;

  /**
   * Save the canonical response so future retries short-circuit.
   */
  saveResponse(args: {
    key: string;
    command: string;
    scopeHash: string;
    response: unknown;
    tx: Tx;
  }): Promise<void>;
}
