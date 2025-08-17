// apps/finance-api/src/infra/persistence/postgres/db.ts

import { drizzle, type NodePgDatabase } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import * as schema from "./schema.postgres";

export const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

// Give Drizzle the schema => enables db.query.<table> with types
export const db: NodePgDatabase<typeof schema> = drizzle(pool, { schema });

// Re-export the schema type if you want to use it elsewhere
export type DB = typeof db;
