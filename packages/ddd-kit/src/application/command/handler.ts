// ## File: packages/ddd-kit/src/application/command/handler.ts

/**
 * ========================
 * Abstract Command Handler
 * ========================
 * This class provides a reusable, transactional pipeline for executing commands
 * against an aggregate. It automates the "load -> execute -> save -> publish" flow, ensuring
 * that every business operation is handled consistently and atomically.
 *
 * It is designed to be persistence-agnostic by depending on a generic `AggregateRepository`
 * interface. This allows you to inject either a CRUD-based repository or an Event Sourcing-based
 * repository without changing any of the command handling logic.
 */

import { AggregateRoot, DomainInvariantError } from "../../domain/aggregate";
// The `Tx` type is an opaque handle representing an active database transaction.
import type { Tx, UnitOfWork } from "../../infra";
import { err, ok, type Result } from "../../shared/result";
// The generic repository interface defines a universal contract for finding and saving an aggregate.
import type { AggregateRepository } from "../repos/aggregate.repository";
import type { ICommand } from "./command";
// The EventPublisher interface defines a contract for publishing domain events.
import { DomainEvent, type EventPublisher } from "./types";

/**
 * Defines the structure of the payload passed to the command handler's `execute` method.
 * It must contain the command payload and, for operations on existing aggregates,
 * the ID of the aggregate to operate on.
 */
export type CommandHandlerPayload<T> = {
  aggregateId?: string;
  payload: T;
};

// The CommandHandler is generic over the type of AggregateRoot it manages and the
// specific type of repository it uses, as long as it fulfills the AggregateRepository contract.
export abstract class CommandHandler<
  TAggregate extends AggregateRoot,
  TRepo extends AggregateRepository<TAggregate>
> {
  // The concrete handler (e.g., `RealEstateCommandHandler`) will provide a map
  // of command names to their corresponding `ICommand` implementations.
  protected abstract commands: Record<string, ICommand<any, any, TAggregate>>;

  constructor(
    // The repository is the gateway to the persistence layer for this aggregate.
    protected readonly repo: TRepo,
    // The Unit of Work ensures that all operations within the handler
    // happen within a single atomic transaction.
    protected readonly uow: UnitOfWork,
    // The event publisher is an optional dependency for broadcasting domain events
    // to other parts of the system after a successful command.
    protected readonly eventPublisher?: EventPublisher
  ) {}

  /**
   * The main public method to execute a command. It orchestrates the entire
   * operation. If an optional transaction `tx` is provided, it will run within that
   * transaction. If not, it will create its own, ensuring a consistent execution
   * boundary for all business logic.
   *
   * @param commandName - The name of the command to execute (e.g., "create-real-estate-asset").
   * @param data - The data for the command, including the payload and optional aggregateId.
   * @param tx - An optional, existing transaction handle. This allows the handler
   * to participate in a larger, single atomic operation managed by an external caller,
   * such as an idempotency wrapper.
   * @returns The result of the command execution, which is the response DTO from the command itself.
   */
  public async execute<TPayload, TResponse>(
    commandName: string,
    data: CommandHandlerPayload<TPayload>,
    tx?: Tx
  ): Promise<Result<TResponse>> {
    // Find the specific command implementation from our command map.
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
     * @param transaction - The active transaction for all database operations.
     */
    const run = async (transaction: Tx): Promise<Result<TResponse>> => {
      // We wrap the core logic in a try/catch block to handle domain errors gracefully.
      try {
        // STEP 1: LOAD
        // Fetch the current state of the aggregate if we're updating it.
        // For creation commands, `data.aggregateId` will be undefined, so the
        // aggregate correctly starts as `undefined`.
        let aggregate: TAggregate | undefined = undefined;
        if (data.aggregateId) {
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

        // STEP 2: EXECUTE
        // Delegate the core business logic to the specific command object.
        // The command will run its logic and buffer any new events inside the aggregate.
        const result = await command.execute(data.payload, aggregate);
        if (!result.ok) {
          // If the command's invariants or business rules fail, stop and forward the error.
          return err(result.error);
        }

        // STEP 3: DESTRUCTURE
        // Get the modified aggregate and the response DTO from the command's result.
        // The aggregate now contains the buffered events, ready for persistence.
        const { aggregate: nextAggregate, response } = result.value;

        // STEP 4: SAVE & CAPTURE EVENTS
        // Persist the aggregate's changes. The `save` method is now responsible for
        // pulling the events, saving them, and returning them. This gives us a
        // definitive list of what was actually persisted.
        const savedEvents = await this.repo.save(transaction, nextAggregate);

        // STEP 5: PUBLISH
        // After successfully saving, publish the events that were returned by the repo.
        // This ensures we only broadcast events that have been durably stored.
        if (this.eventPublisher && savedEvents.length > 0) {
          await this.eventPublisher.publish(
            savedEvents as DomainEvent<unknown>[],
            transaction
          );
        }

        // STEP 6: RETURN
        // Finally, return the successful response DTO to the caller.
        return ok(response);
      } catch (e) {
        // STEP 7: CATCH & TRANSFORM
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
        // For any other unexpected error, re-throw it to be handled
        // as a 500 Internal Server Error.
        throw e;
      }
    };

    // If an external transaction `tx` was provided, we run our logic within it.
    if (tx) {
      return run(tx);
    }
    // Otherwise, we wrap our logic in a new transaction managed by the Unit of Work.
    else {
      return this.uow.withTransaction(run);
    }
  }
}
