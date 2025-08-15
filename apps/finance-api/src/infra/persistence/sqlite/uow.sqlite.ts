// apps/finance-api/src/infra/persistence/sqlite/uow.sqlite.ts

import type { Tx, UnitOfWork } from "@acme/sdk-lite/infra";
import { DB, db } from "./db";

type SqliteTx = DB;

export const SqliteUoW: UnitOfWork = {
  async withTransaction<T>(fn: (tx: Tx) => Promise<T>): Promise<T> {
    // The transaction implementation for better-sqlite3
    return db.transaction((tx) => fn(tx as unknown as Tx));
  },
};

// Helper for repos to “unwrap” Tx when needed (casting it to specific DB type)
export const asSqlite = (tx: Tx) => tx as SqliteTx;
