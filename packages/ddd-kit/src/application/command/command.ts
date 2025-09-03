/**
 * Defines the contract for a Command.
 * A command encapsulates the logic for a single atomic business operation.
 * It is decoupled from infrastructure concerns like persistence and transactions.
 */
import { AggregateRoot } from "../../domain/aggregate";
import type { Result } from "../../shared/result";
import type { DomainEvent } from "./types";

/**
 * The result of a successful command execution.
 * It contains the next state of the aggregate, any domain events that were raised,
 * and the response DTO to be returned to the caller.
 */
export type CommandOutput<T extends AggregateRoot, TResponse> = {
  aggregate: T;
  events: DomainEvent<unknown>[];
  response: TResponse;
};

/**
 * ICommand Interface
 * @template TPayload - The data transfer object (DTO) for the command's input.
 * @template TResponse - The data transfer object (DTO) for the successful response.
 * @template TAggregate - The type of Aggregate Root this command operates on.
 */
export interface ICommand<
  TPayload,
  TResponse,
  TAggregate extends AggregateRoot
> {
  /**
   * Executes the command's logic.
   * @param payload - The input data for the command.
   * @param aggregate - The current state of the aggregate. This will be `undefined` for creation commands.
   * @returns A Result object containing a CommandOutput on success, or an error on failure.
   */
  execute(
    payload: TPayload,
    aggregate?: TAggregate
  ):
    | Promise<Result<CommandOutput<TAggregate, TResponse>>>
    | Result<CommandOutput<TAggregate, TResponse>>;
}
