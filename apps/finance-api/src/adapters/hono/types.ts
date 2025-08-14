import { AggregateCrudRepository } from "@acme/sdk-lite";
import type { UnitOfWork } from "@acme/sdk-lite/infra";
import { RealEstate } from "../../domain/real-estate/real-estate.aggregate";

// What commands need from the app (clock + id factory)
export type AppEnv = { newId(): string; now(): Date };

// Variables we store on Hono's context (c.var)
export type Vars = {
  uow: UnitOfWork; // transaction runner (e.g., DrizzleUoW)
  env: AppEnv; // injected deps for commands
  // reositories
  reRepo: AggregateCrudRepository<RealEstate>;
  // add more when needed: db, idemStore, sha256, etc.
};
