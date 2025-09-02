// ## File: packages/ddd-kit/src/application/command/handler.ts

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
// Import the `Tx` type to be used in the `execute` method signature.
import type { Tx, UnitOfWork } from "../../infra";
import { err, ok, type Result } from "../../shared/result";
// We now import the new, generic repository interface.
// This interface defines a universal contract for finding and saving an aggregate.
import type { AggregateRepository } from "../repos/aggregate.repository";
import type { ICommand } from "./command";
// Import the EventPublisher interface.
import { type EventPublisher } from "./types";

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
    protected readonly uow: UnitOfWork,
    // The event publisher is now an optional dependency.
    // Making it optional prevents breaking changes for services that don't need eventing.
    protected readonly eventPublisher?: EventPublisher
  ) {}

  /**
   * The main public method to execute a command. It orchestrates the entire
   * operation. If an optional transaction `tx` is provided, it will run within that
   * transaction. If not, it will create its own, ensuring a consistent execution
   * boundary for all business logic.
   *
   * @param {string} commandName - The name of the command to execute (e.g., "create-real-estate-asset").
   * @param {CommandHandlerPayload<TPayload>} data - The data for the command, including the payload and optional aggregateId.
   * @param {Tx} [tx] - An optional, existing transaction handle. This is the key to allowing
   * this handler to participate in a larger, single atomic operation managed by an external caller,
   * such as an idempotency wrapper.
   * @returns {Promise<Result<TResponse>>} The result of the command execution, which is the response DTO from the command itself.
   */
  public async execute<TPayload, TResponse>(
    commandName: string,
    data: CommandHandlerPayload<TPayload>,
    tx?: Tx // <-- The new optional parameter.
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

    /**
     * This inner function encapsulates the core "load -> execute -> save -> publish" pipeline.
     * It's designed to be called within a transaction, which is passed as the `transaction` parameter.
     * @param {Tx} transaction - The active transaction for all database operations.
     */
    const run = async (transaction: Tx): Promise<Result<TResponse>> => {
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
            transaction,
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
        // And also pull the events out from the result.
        const { aggregate: nextAggregate, response, events } = result.value;

        // Step 4: SAVE
        await this.repo.save(transaction, nextAggregate);

        // Step 5: PUBLISH
        // After successfully saving, we publish any domain events for other
        // parts of the system to react to (e.g., updating read models, sending notifications).
        if (this.eventPublisher && events.length > 0) {
          await this.eventPublisher.publish(events, transaction);
        }

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
    };

    // If an external transaction `tx` was provided, we run our logic within it.
    if (tx) {
      return run(tx);
    }
    // Otherwise, we wrap our logic in a new transaction managed by the Unit of Work.
    // This preserves the original behavior for calls that aren't wrapped in an
    // external transaction manager like the idempotency helper.
    else {
      return this.uow.withTransaction(run);
    }
  }
}
