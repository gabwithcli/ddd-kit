// apps/finance-api/src/adapters/hono/types.ts

import { PersistenceLayer } from "src/infra/persistence";
import { CommandLayer } from "../../application/commands";

// What commands need from the app (clock + id factory)
export type AppEnv = { newId(): string; now(): Date; now_iso(): string };

// Variables we store on Hono's context (c.var)
export type Vars = {
  userId: string; // TBI: Auth To-Be-Implemented
  env: AppEnv;
  // Adding the command handlers layer here for injection
  handlers: CommandLayer;
  persistence: PersistenceLayer;
};
