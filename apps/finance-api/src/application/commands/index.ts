// apps/finance-api/src/application/commands/index.ts

import {
  // We update our imports to use the generic repository interface.
  AggregateRepository,
  CommandHandler,
} from "@acme/sdk-lite";
import { AppEnv } from "../../adapters/hono/types";
import { RealEstate } from "../../domain/real-estate/real-estate.aggregate";
import { PersistenceLayer } from "../../infra/persistence";
import { RealEstateCommandHandler } from "./real-estate/real-estate.handler";

/**
 * CommandLayer
 * ============
 * This interface defines the shape of the command handling layer that will
 * be injected into our application (e.g., into the Hono context).
 * It serves as a central point of access for all command handlers.
 *
 * ## Note ##
 * We've updated the type signature to use the generic `AggregateRepository`.
 * This ensures that the entire application, from the top-level dependency
 * injection down to the handler itself, is fully decoupled from the
 * persistence strategy.
 */
export interface CommandLayer {
  real_estate: CommandHandler<RealEstate, AggregateRepository<RealEstate>>;
  // Add other handlers for different aggregates here, for example:
  // portfolio: CommandHandler<Portfolio, AggregateRepository<Portfolio>>;
}

/**
 * getCommandLayer (Factory Function)
 * ==================================
 * This factory is responsible for creating and wiring up all the command handlers
 * with their necessary dependencies (repositories, unit of work, and environment helpers).
 */
export function getCommandLayer({
  persistance_layer,
  app_env,
}: {
  persistance_layer: PersistenceLayer;
  app_env: AppEnv;
}): CommandLayer {
  return {
    // We instantiate our now persistence-agnostic RealEstateCommandHandler.
    // The `persistance_layer.repos.real_estate` will conform to the
    // `AggregateRepository` interface, making this wiring type-safe and correct.
    real_estate: new RealEstateCommandHandler({
      repo: persistance_layer.repos.real_estate,
      uow: persistance_layer.uow,
      newId: app_env.newId,
      now: app_env.now,
    }),
    // Instantiate other handlers here...
  };
}
