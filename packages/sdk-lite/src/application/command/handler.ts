// packages/sdk-lite/src/application/command/handler.ts

/**
 * Abstract Command Handler
 * ========================
 * This class provides a reusable, transactional pipeline for executing commands
 * against an aggregate. It automates the "load -> execute -> save" flow, ensuring
 * that every business operation is handled consistently and atomically.
 *
 * This revised version is now decoupled from a specific persistence strategy (like CRUD)
 * by depending on a generic `AggregateRepository` interface. This allows you to
 * inject either a CRUD-based repository or an Event Sourcing-based repository
 * without changing any of the command handling logic.
 */

import { AggregateRoot } from "../../domain/aggregate";
import type { UnitOfWork } from "../../infra";
import { err, ok, type Result } from "../../shared/result";
// We now import the new, generic repository interface.
// This interface defines a universal contract for finding and saving an aggregate.
import type { AggregateRepository } from "../repos/aggregate.repository";
import type { ICommand } from "./command";

/**
 * Defines the structure of the payload passed to the command handler's `execute` method.
 * It must contain the command payload and, for operations on existing aggregates,
 * the ID of the aggregate to operate on.
 */
export type CommandHandlerPayload<T> = {
  aggregateId?: string;
  payload: T;
};

// The CommandHandler is now generic over any class that implements `AggregateRepository`.
// This is the key change that enables persistence flexibility.
export abstract class CommandHandler<
  TAggregate extends AggregateRoot,
  TRepo extends AggregateRepository<TAggregate>
> {
  // The concrete handler (e.g., `RealEstateCommandHandler`) will provide a map
  // of command names to their corresponding `ICommand` implementations.
  protected abstract commands: Record<string, ICommand<any, any, TAggregate>>;

  constructor(
    // The repository dependency is now of the generic `TRepo` type.
    protected readonly repo: TRepo,
    // The Unit of Work ensures that all operations (load, save, etc.)
    // happen within a single atomic transaction.
    protected readonly uow: UnitOfWork
  ) {}

  /**
   * The main public method to execute a command. It orchestrates the entire
   * operation within a single transaction, providing a consistent execution
   * boundary for all your business logic.
   *
   * @param commandName - The name of the command to execute (e.g., "create-real-estate").
   * @param data - The data for the command, including the payload and optional aggregateId.
   * @returns The result of the command execution, which is the response DTO from the command itself.
   */
  public async execute<TPayload, TResponse>(
    commandName: string,
    data: CommandHandlerPayload<TPayload>
  ): Promise<Result<TResponse>> {
    // First, we find the specific command implementation from our command map.
    // This allows a single handler to manage multiple operations for an aggregate.
    const command = this.commands[commandName];
    if (!command) {
      return err(
        new Error(`Command "${commandName}" not found on this handler.`)
      );
    }

    // The entire process is wrapped in a transaction managed by the Unit of Work.
    // If any step fails, the entire transaction is rolled back, ensuring data consistency.
    return this.uow.withTransaction(async (tx) => {
      // Step 1: LOAD
      // We need to fetch the current state of the aggregate if we're updating it.
      // For creation commands, `data.aggregateId` will be undefined, so the
      // aggregate correctly starts as `undefined`.
      let aggregate: TAggregate | undefined = undefined;
      if (data.aggregateId) {
        // We now use the generic `findById` method from our new repository interface.
        // This abstracts away how the aggregate is loaded.
        // - For a CRUD repo, this will be a `SELECT` from a table.
        // - For an ES repo, this will involve reading all events for a stream and replaying them.
        const loadedAggregate = await this.repo.findById(tx, data.aggregateId);
        if (!loadedAggregate) {
          // It's crucial to ensure the aggregate exists before trying to modify it.
          return err(
            new Error(`Aggregate with id ${data.aggregateId} not found.`)
          );
        }
        aggregate = loadedAggregate;
      }

      // Step 2: EXECUTE
      // We delegate the core business logic to the specific command object.
      // The command receives the payload and the current state of the aggregate (if any).
      // It contains the domain expertise to decide if the operation is valid.
      const result = await command.execute(data.payload, aggregate);

      if (!result.ok) {
        // If the command's invariants or business rules fail, we immediately
        // stop and forward the error. The transaction will be rolled back.
        return err(result.error);
      }

      // Step 3: DESTRUCTURE
      // On success, the command returns the new state of the aggregate and a response DTO.
      const { aggregate: nextAggregate, response } = result.value;

      // Step 4: SAVE
      // We persist the new state of the aggregate using the generic `save` method.
      // This again abstracts away the persistence mechanism.
      // - For a CRUD repo, this will `UPDATE` the row and increment its version number.
      // - For an ES repo, this will pull the new events from the aggregate (`.pullEvents()`)
      //   and append them to the event stream.
      await this.repo.save(tx, nextAggregate);

      // Step 5: PUBLISH (Future Enhancement)
      // After successfully saving, you would publish any domain events for other
      // parts of the system to react to (e.g., updating read models, sending notifications).
      // const events = nextAggregate.pullEvents();
      // await this.eventPublisher.publish(events);

      // Step 6: RETURN
      // Finally, we return the successful response DTO to the caller (e.g., the API handler).
      return ok(response);
    });
  }
}
