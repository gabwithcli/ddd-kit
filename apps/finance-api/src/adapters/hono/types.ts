// apps/finance-api/src/adapters/hono/types.ts

import { AggregateCrudRepository } from "@acme/sdk-lite";
import type { UnitOfWork } from "@acme/sdk-lite/infra";
import { RealEstateCommandHandler } from "../../application/real-estate/real-estate.handler";
import { RealEstate } from "../../domain/real-estate/real-estate.aggregate";

// What commands need from the app (clock + id factory)
export type AppEnv = { newId(): string; now(): Date };

// Variables we store on Hono's context (c.var)
export type Vars = {
  uow: UnitOfWork;
  env: AppEnv;
  reRepo: AggregateCrudRepository<RealEstate>;
  // Add the new handler for injection
  reCmdHandler: RealEstateCommandHandler;
};
