// apps/finance-api/src/infra/persistence/index.ts

import { AggregateCrudRepository, CommandHandler } from "@acme/sdk-lite";

// Import both implementations
import { AppEnv } from "../../adapters/hono/types";
import { RealEstate } from "../../domain/real-estate/real-estate.aggregate";
import { PersistenceLayer } from "../../infra/persistence";
import { RealEstateCommandHandler } from "./real-estate/real-estate.handler";

// Define the shape of the object our factory will return.
export interface CommandLayer {
  real_estate: CommandHandler<RealEstate, AggregateCrudRepository<RealEstate>>;
  // add other handlers here...
}

export function getCommandLayer({
  persistance_layer,
  app_env,
}: {
  persistance_layer: PersistenceLayer;
  app_env: AppEnv;
}): CommandLayer {
  return {
    real_estate: new RealEstateCommandHandler({
      repo: persistance_layer.repos.real_estate,
      uow: persistance_layer.uow,
      newId: app_env.newId,
      now: app_env.now,
    }),
    // other handlers go here...
  };
}
