import type { IdempotencyStore } from "../infra/idempotency-store";
import type { Tx } from "../infra/unit-of-work";

/**
 * InMemoryIdempotencyStore
 * ------------------------
 * Test/local adapter for IdempotencyStore. DO NOT use in production:
 * - No TTL cleanup
 * - No cross-process visibility
 * - No durability
 */
export class InMemoryIdempotencyStore implements IdempotencyStore {
  private map = new Map<string, { response?: unknown }>();

  /** Combines command + scope + key into one string. */
  private keyOf(key: string, command: string, scopeHash: string) {
    return `${command}::${scopeHash}::${key}`;
  }

  async tryClaim(args: {
    key: string;
    command: string;
    scopeHash: string;
    payloadHash: string;
    now: Date;
    tx: Tx;
  }): Promise<"claimed" | { response: unknown }> {
    const k = this.keyOf(args.key, args.command, args.scopeHash);

    // If this is the first time we see the key → "claim" it by inserting an empty row.
    if (!this.map.has(k)) {
      this.map.set(k, {}); // claimed but no response yet
      return "claimed";
    }

    // If a response exists → short-circuit retry with the same response.
    const row = this.map.get(k)!;
    if (row.response !== undefined) return { response: row.response };

    // Otherwise: already claimed and still in-flight → treat as claimed.
    return "claimed";
  }

  async saveResponse(args: {
    key: string;
    command: string;
    scopeHash: string;
    response: unknown;
    tx: Tx;
  }): Promise<void> {
    const k = this.keyOf(args.key, args.command, args.scopeHash);
    const row = this.map.get(k) ?? {};
    row.response = args.response;
    this.map.set(k, row);
  }
}
