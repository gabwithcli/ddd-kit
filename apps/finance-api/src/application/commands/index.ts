// apps/finance-api/src/application/commands/index.ts

import {
  AggregateRepository,
  CommandHandler,
  ConsoleEventPublisher,
  EventPublisher,
  ProjectionManager,
  Tx,
} from "ddd-kit";
import { DomainEvents } from "src/domain/aggregate-events";
import { RealEstateSummaryEventProjector } from "src/infra/persistence/postgres/real-estate/real-estate-assets-summaries.event-projector.postgres";
import { AppEnv } from "../../adapters/hono/types";
import { RealEstate } from "../../domain/real-estate/real-estate.aggregate";
import { PersistenceLayer } from "../../infra/persistence";
import { RealEstateCommandHandler } from "./real-estate/real-estate.handler";

/**
 * A simple composite event publisher that delegates to multiple publishers.
 * This allows us to both update our read models (via ProjectionManager) and
 * log events to the console (via ConsoleEventPublisher) from a single point.
 * It's like a power strip: you plug it in once, and it powers multiple devices.
 */
class CompositeEventPublisher implements EventPublisher {
  // We hold an array of all the publishers we want to notify.
  constructor(private readonly publishers: EventPublisher[]) {}

  /**
   * The publish method iterates through all registered publishers and calls
   * their respective publish methods in parallel.
   */
  public async publish(events: DomainEvents[], tx: Tx): Promise<void> {
    // We use Promise.all to run all publishing tasks concurrently.
    await Promise.all(this.publishers.map((p) => p.publish(events, tx)));
  }
}

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
  // 1. Set up the ProjectionManager for our read models.
  const projectionManager = new ProjectionManager();
  const realEstateSummaryProjector = new RealEstateSummaryEventProjector(
    persistance_layer.repos.real_estate
  );
  projectionManager.register(realEstateSummaryProjector);

  // 2. Set up the console logger for development visibility.
  const consoleEventPublisher = new ConsoleEventPublisher();

  // 3. Create the composite publisher that combines both.
  const compositePublisher = new CompositeEventPublisher([
    consoleEventPublisher,
    projectionManager,
  ]);

  return {
    // 4. Inject the single composite publisher into our command handler.
    // The handler doesn't need to know it's talking to multiple publishers;
    // it just sees a single `EventPublisher` interface.
    real_estate: new RealEstateCommandHandler({
      repo: persistance_layer.repos.real_estate,
      uow: persistance_layer.uow,
      eventPublisher: compositePublisher,
      newId: app_env.newId,
      now: app_env.now,
    }),
    // Instantiate other handlers here...
  };
}
