// packages/sdk-lite/src/application/command/handler.ts

/**
 * Abstract Command Handler
 * This class provides a reusable, transactional pipeline for executing commands against an aggregate.
 * It automates the "load -> execute -> save" flow.
 */
import { AggregateRoot } from "../../domain/aggregate";
import type { UnitOfWork } from "../../infra";
import { err, ok, type Result } from "../../shared/result";
import type { AggregateCrudRepository } from "../repos";
import type { ICommand } from "./command";

/**
 * Defines the structure of the payload passed to the command handler's execute method.
 * It must contain the command payload and optionally the ID of the aggregate to operate on.
 */
export type CommandHandlerPayload<T> = {
  aggregateId?: string;
  payload: T;
};

export abstract class CommandHandler<
  TAggregate extends AggregateRoot,
  TRepo extends AggregateCrudRepository<TAggregate>
> {
  // The concrete handler will provide a map of command names to command implementations.
  protected abstract commands: Record<string, ICommand<any, any, TAggregate>>;

  constructor(
    protected readonly repo: TRepo,
    protected readonly uow: UnitOfWork
  ) {}

  /**
   * The main public method to execute a command.
   * It orchestrates the entire operation within a single transaction.
   *
   * @param commandName - The name of the command to execute (e.g., "create", "addAppraisal").
   * @param data - The data for the command, including the payload and optional aggregateId.
   * @returns The result of the command execution, which is the response DTO from the command itself.
   */
  public async execute<TPayload, TResponse>(
    commandName: string,
    data: CommandHandlerPayload<TPayload>
  ): Promise<Result<TResponse>> {
    const command = this.commands[commandName];
    if (!command) {
      return err(
        new Error(`Command "${commandName}" not found on this handler.`)
      );
    }

    return this.uow.withTransaction(async (tx) => {
      // 1. LOAD: Explicitly handle loading for existing aggregates.
      // For creation commands, the aggregate correctly starts as `undefined`.
      let aggregate: TAggregate | undefined = undefined;
      if (data.aggregateId) {
        const loadedAggregate = await this.repo.load(tx, data.aggregateId);
        if (!loadedAggregate) {
          return err(
            new Error(`Aggregate with id ${data.aggregateId} not found.`)
          );
        }
        aggregate = loadedAggregate;
      }

      // 2. EXECUTE: Run the specific command's logic.
      const result = await command.execute(data.payload, aggregate);

      if (!result.ok) {
        // If the command's invariants fail, we forward the error.
        return err(result.error);
      }

      // 3. DESTRUCTURE: The command output contains the next state and the response.
      const { aggregate: nextAggregate, response } = result.value;

      // 4. SAVE: Persist the new state of the aggregate.
      // This works for both creations and updates.
      await this.repo.save(tx, nextAggregate);

      // 5. PUBLISH (Future): You would pull and publish domain events here.
      // const events = nextAggregate.pullEvents();
      // await this.eventPublisher.publish(events);

      // 6. RETURN: Return the successful response DTO.
      return ok(response);
    });
  }
}
