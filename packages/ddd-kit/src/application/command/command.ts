/**
 * Defines the contract for a Command.
 * A command encapsulates the logic for a single atomic business operation.
 * It is decoupled from infrastructure concerns like persistence and transactions.
 */
import { AggregateRoot, EdgeError } from "../../domain/aggregate";
import type { Result } from "../../shared/result";

/**
 * A utility type that ensures a type T has exactly the same keys as type Shape.
 * If T has any extra keys, they are mapped to the 'never' type, causing a compile error.
 * This is used to prevent accidental extra properties on return types, enforcing a strict contract.
 */
type Exact<T, Shape> = T & Record<Exclude<keyof T, keyof Shape>, never>;

/**
 * The result of a successful command execution.
 * It contains the next state of the aggregate and the response DTO to be returned to the caller.
 * The responsibility of pulling events is delegated to the CommandHandler.
 */
export type CommandOutput<T extends AggregateRoot, TResponse> = Exact<
  {
    aggregate: T;
    response: TResponse;
  },
  { aggregate: T; response: TResponse }
>;

/**
 * ICommand Interface
 * @template TPayload - The data transfer object (DTO) for the command's input.
 * @template TResponse - The data transfer object (DTO) for the successful response.
 * @template TAggregate - The type of Aggregate Root this command operates on.
 * @template TError - The type of the error object this command can return. Defaults to EdgeError.
 */
export interface ICommand<
  TPayload,
  TResponse,
  TAggregate extends AggregateRoot,
  TError = EdgeError
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
    | Promise<Result<CommandOutput<TAggregate, TResponse>, TError>>
    | Result<CommandOutput<TAggregate, TResponse>, TError>;
}
