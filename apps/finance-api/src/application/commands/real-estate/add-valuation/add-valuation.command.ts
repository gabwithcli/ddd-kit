import {
  CommandOutput,
  err,
  ICommand,
  ok,
  Result,
  SuccessResponse,
} from "ddd-kit";
import { z } from "zod";
import { RealEstate } from "../../../../domain/real-estate/real-estate.aggregate";
import { Money } from "../../../../domain/shared/money";
import { addValuationPayloadSchema } from "./add-valuation.command.schema";

type CommandPayload = z.infer<typeof addValuationPayloadSchema>;
type CommandDependencies = { newId(): string };
type CommandResponse = SuccessResponse;
type CommandReturnValue = CommandOutput<RealEstate, CommandResponse>;

export class AddValuationCommand
  implements ICommand<CommandPayload, CommandResponse, RealEstate>
{
  constructor(private readonly deps: CommandDependencies) {}

  public execute(
    payload: CommandPayload,
    aggregate?: RealEstate
  ): Result<CommandReturnValue> {
    if (!aggregate) {
      return err({
        kind: "BadRequest",
        message: "Cannot add a valuation to a non-existent asset.",
      });
    }

    const valuationId = `val_${this.deps.newId()}`;
    const value = Money.from(payload.value, aggregate.details.baseCurrency);

    aggregate.addValuation({ id: valuationId, date: payload.date, value });

    const output: CommandReturnValue = {
      aggregate: aggregate,
      response: { id: valuationId },
    };
    return ok(output);
  }
}
