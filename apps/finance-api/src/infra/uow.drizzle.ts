// src/infra/uow.drizzle.ts
import type { Tx, UnitOfWork } from "@acme/sdk-lite/infra";
import type { NodePgDatabase } from "drizzle-orm/node-postgres";
import { db } from "./db";
import * as schema from "./schema";

type DrizzleTx = NodePgDatabase<typeof schema>;

export const DrizzleUoW: UnitOfWork = {
  async withTransaction<T>(fn: (tx: Tx) => Promise<T>): Promise<T> {
    // tx is typed as NodePgDatabase<typeof schema>
    return db.transaction(async (tx) => fn(tx as unknown as Tx));
  },
};

// Helper for repos to “unwrap” Tx when needed
export const asDrizzle = (tx: Tx) => tx as unknown as DrizzleTx;
