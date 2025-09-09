import {
  jsonb,
  pgSchema,
  primaryKey,
  timestamp,
  varchar,
} from "drizzle-orm/pg-core";
import { realEstateSummariesColumns } from "./real-estate/real-estate.read-model.schema.postgres";
import {
  realEstateAppraisalsColumns,
  realEstateAssetsColumns,
  realEstateValuationsColumns,
} from "./real-estate/real-estate.schema.postgres";

/**
 * In PostgreSQL, a "schema" acts like a folder to group related tables.
 * We're defining a 'real_estate' schema to hold all our tables for this domain.
 * @see https://orm.drizzle.team/docs/sql-schema-declaration
 */
export const realEstateFolder = pgSchema("real_estate");

// Here we define the actual table objects that Drizzle will use for queries.
// We pass the column definitions we created in the other file.

// The main table for the RealEstate aggregate root.
export const realEstateAssets = realEstateFolder.table(
  "real_estates",
  realEstateAssetsColumns
);

// The table for the Appraisal child entities.
export const realEstateAppraisals = realEstateFolder.table(
  "real_estate_appraisals",
  realEstateAppraisalsColumns
);

// The table for the formal Valuation child entities.
export const realEstateValuations = realEstateFolder.table(
  "real_estate_valuations",
  realEstateValuationsColumns
);

// Add the new read model table definition
export const realEstateSummaries = realEstateFolder.table(
  "real_estate_summaries",
  realEstateSummariesColumns
);

// The table for managing idempotency of commands.
export const idempotencyKeys = realEstateFolder.table(
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
