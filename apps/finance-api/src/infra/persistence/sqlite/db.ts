// apps/finance-api/src/infra/persistence/sqlite/db.ts

import Database from "better-sqlite3";
import { BetterSQLite3Database, drizzle } from "drizzle-orm/better-sqlite3";
import * as schema from "./real-estate.schema.sqlite";

// This points to a local file for the database.
const sqlite = new Database("data/local-development.db");
export const db: BetterSQLite3Database<typeof schema> = drizzle(sqlite, {
  schema,
});

// Re-export the schema type if you want to use it elsewhere
export type DB = typeof db;
