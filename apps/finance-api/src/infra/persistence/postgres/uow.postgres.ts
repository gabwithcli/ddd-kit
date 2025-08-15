// apps/finance-api/src/infra/persistence/postgres/uow.postgres.ts

import type { Tx, UnitOfWork } from "@acme/sdk-lite/infra";
import { DB, db } from "./db";

type PostgresTx = DB;

export const PostgresUoW: UnitOfWork = {
  async withTransaction<T>(fn: (tx: Tx) => Promise<T>): Promise<T> {
    // tx is typed as NodePgDatabase<typeof schema>
    return db.transaction(async (tx) => fn(tx));
  },
};

// Helper for repos to “unwrap” Tx when needed (casting it to specific DB type)
export const asPostgres = (tx: Tx) => tx as PostgresTx;
