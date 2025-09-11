// ## File: apps/finance-api/src/infra/persistence/postgres/idempotency.store.postgres.ts

import { IdempotencyStore, Tx } from "ddd-kit";
import { and, eq } from "drizzle-orm";
import { asPostgres } from "./uow.postgres";
// We import the table definition from our central schema file.
import { idempotencyKeys } from "./utilities.schema.postgres";

/**
 * A PostgreSQL implementation of the IdempotencyStore.
 * It uses an `idempotency_keys` table to atomically claim keys and store command responses,
 * ensuring that retried operations are not executed twice.
 */
export class PostgresIdempotencyStore implements IdempotencyStore {
  /**
   * Tries to claim a key for a specific command and scope within a transaction.
   * This operation is atomic.
   */
  async tryClaim(args: {
    key: string;
    command: string;
    scopeHash: string;
    tx: Tx;
  }): Promise<"claimed" | { response: unknown }> {
    // Cast the generic transaction `Tx` to our Drizzle-specific transaction type.
    const dtx = asPostgres(args.tx);

    try {
      // 1. Attempt to insert a new record for the idempotency key.
      // The magic is in `onConflictDoNothing()`. If a row with the same composite
      // primary key (key, commandName, scopeHash) already exists, this command
      // does nothing and does not throw an error. This is how we atomically "claim" the key.
      await dtx
        .insert(idempotencyKeys)
        .values({
          key: args.key,
          commandName: args.command,
          scopeHash: args.scopeHash,
        })
        .onConflictDoNothing();

      // 2. Now, we select the row. It's guaranteed to exist, either because we just
      // inserted it or because it was already there.
      const row = await dtx.query.idempotencyKeys.findFirst({
        where: and(
          eq(idempotencyKeys.key, args.key),
          eq(idempotencyKeys.commandName, args.command),
          eq(idempotencyKeys.scopeHash, args.scopeHash)
        ),
      });

      // 3. Check if a response has already been saved for this key.
      if (row && row.responsePayload) {
        // If a response payload exists, it means this is a retry of a *completed* command.
        // We return the previously saved response, short-circuiting the operation.
        // Note: The payload is stored as JSONB, so it's already an object.
        return { response: row.responsePayload };
      }

      // 4. If no response payload is found, the key has been successfully claimed
      // for the first time. The command can proceed.
      return "claimed";
    } catch (e) {
      // If any other unexpected database error occurs, we let it bubble up.
      console.error("Idempotency store error during tryClaim:", e);
      throw new Error(`Idempotency store error: ${(e as Error).message}`);
    }
  }

  /**
   * Saves the successful response of a command against its idempotency key.
   */
  async saveResponse(args: {
    key: string;
    command: string;
    scopeHash: string;
    response: unknown;
    tx: Tx;
  }): Promise<void> {
    const dtx = asPostgres(args.tx);

    // Update the record we created in `tryClaim`, setting the response_payload.
    // This completes the idempotency cycle for this key.
    await dtx
      .update(idempotencyKeys)
      .set({ responsePayload: args.response })
      .where(
        and(
          eq(idempotencyKeys.key, args.key),
          eq(idempotencyKeys.commandName, args.command),
          eq(idempotencyKeys.scopeHash, args.scopeHash)
        )
      );
  }
}
