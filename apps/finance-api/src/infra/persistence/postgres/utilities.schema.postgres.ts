import {
  jsonb,
  pgSchema,
  primaryKey,
  timestamp,
  varchar,
} from "drizzle-orm/pg-core";

/**
 * In PostgreSQL, a "schema" acts like a folder to group related tables.
 * We're defining a 'real_estate' schema to hold all our tables for this domain.
 * @see https://orm.drizzle.team/docs/sql-schema-declaration
 */
export const utilitiesFolder = pgSchema("utilities");

// The table for managing idempotency of commands.
export const idempotencyKeys = utilitiesFolder.table(
  "idempotency_keys",
  {
    key: varchar("key", { length: 128 }).notNull(),
    commandName: varchar("command_name", { length: 128 }).notNull(),
    scopeHash: varchar("scope_hash", { length: 64 }).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    // Use jsonb for the response payload for more efficient querying if needed.
    responsePayload: jsonb("response_payload"),
  },
  (table) => {
    // Define a composite primary key on the combination of key, command, and scope.
    return {
      pk: primaryKey({
        columns: [table.key, table.commandName, table.scopeHash],
      }),
    };
  }
);
