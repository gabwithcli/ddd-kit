// packages/ddd-kit/src/application/command/handler.ts

/**
 * Abstract Command Handler
 * ========================
 * This class provides a reusable, transactional pipeline for executing commands
 * against an aggregate. It automates the "load -> execute -> save -> publish" flow, ensuring
 * that every business operation is handled consistently and atomically.
 *
 * This revised version is now decoupled from a specific persistence strategy (like CRUD or Event Sourcing).
 * by depending on a generic `AggregateRepository` interface. This allows you to
 * inject either a CRUD-based repository or an Event Sourcing-based repository
 * without changing any of the command handling logic.
 */

import { AggregateRoot, DomainInvariantError } from "../../domain/aggregate";
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
      // Return a structured error if the command doesn't exist.
      return err({
        kind: "BadRequest",
        message: `Command "${commandName}" not found on this handler.`,
      });
    }

    // The entire process is wrapped in a transaction managed by the Unit of Work.
    // If any step fails, the entire transaction is rolled back, ensuring data consistency.
    return this.uow.withTransaction(async (tx) => {
      // We wrap the core logic in a try/catch block to handle domain errors gracefully.
      try {
        // Step 1: LOAD
        // We need to fetch the current state of the aggregate if we're updating it.
        // For creation commands, `data.aggregateId` will be undefined, so the
        // aggregate correctly starts as `undefined`.
        let aggregate: TAggregate | undefined = undefined;
        if (data.aggregateId) {
          // We now use the generic `findById` method from our new repository interface.
          // This abstracts away how the aggregate is loaded.
          const loadedAggregate = await this.repo.findById(
            tx,
            data.aggregateId
          );
          if (!loadedAggregate) {
            // It's crucial to ensure the aggregate exists before trying to modify it.
            return err({
              kind: "NotFound",
              message: `Aggregate with id ${data.aggregateId} not found.`,
            });
          }
          aggregate = loadedAggregate;
        }

        // Step 2: EXECUTE
        // We delegate the core business logic to the specific command object.
        // This is where a DomainInvariantError might be thrown.
        const result = await command.execute(data.payload, aggregate);

        if (!result.ok) {
          // If the command's invariants or business rules fail by returning an error,
          // we immediately stop and forward the error.
          return err(result.error);
        }

        // Step 3: DESTRUCTURE
        const { aggregate: nextAggregate, response } = result.value;

        // Step 4: SAVE
        await this.repo.save(tx, nextAggregate);

        // Step 5: PUBLISH (Future Enhancement)
        // After successfully saving, you would publish any domain events for other
        // parts of the system to react to (e.g., updating read models, sending notifications).
        // const events = nextAggregate.pullEvents();
        // await this.eventPublisher.publish(events);

        // Step 6: RETURN
        // Finally, we return the successful response DTO to the caller.
        return ok(response);
      } catch (e) {
        // Step 7: CATCH & TRANSFORM
        // If a DomainInvariantError was thrown during execution, we catch it here.
        if (e instanceof DomainInvariantError) {
          // We transform it into a structured 'InvariantViolation' error that
          // our API's `respond` helper can understand and map to a 422 status code.
          return err({
            kind: "InvariantViolation",
            message: e.message,
            details: e.details,
          });
        }
        // For any other unexpected error, we re-throw it to let it be handled
        // as a true 500 Internal Server Error.
        throw e;
      }
    });
  }
}
