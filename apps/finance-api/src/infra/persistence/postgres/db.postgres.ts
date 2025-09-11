// apps/finance-api/src/infra/persistence/postgres/db.postgres.ts

import { drizzle, type NodePgDatabase } from "drizzle-orm/node-postgres";
import { Pool } from "pg";

// Import schemas from different domains
import * as realEstateSchema from "./real-estate/real-estate.schema.postgres";
import * as utilitiesSchema from "./utilities.schema.postgres";

// Merge them into a single schema object
const schema = {
  ...utilitiesSchema,
  ...realEstateSchema,
};

export const pool = new Pool({
  connectionString: process.env.POSTGRES_DB_URL!,
});

// Pass merged schema to Drizzle => enables db.query.<table> with types
export const db: NodePgDatabase<typeof schema> = drizzle(pool, { schema });

// Handy type alias for usage elsewhere
export type DB = typeof db;
