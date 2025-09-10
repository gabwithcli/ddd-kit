import { CommandOutput, err, ICommand, ok, Result } from "ddd-kit";
import { z } from "zod";
import { RealEstate } from "../../../../domain/real-estate/real-estate.aggregate";
import { Money } from "../../../../domain/shared/money";
import { updateValuationPayloadSchema } from "./update-valuation.command.schema";

type CommandPayload = z.infer<typeof updateValuationPayloadSchema>;
type CommandResponse = { valuationId: string };
type CommandReturnValue = CommandOutput<RealEstate, CommandResponse>;

export class UpdateValuationCommand
  implements ICommand<CommandPayload, CommandResponse, RealEstate>
{
  public execute(
    payload: CommandPayload,
    aggregate?: RealEstate
  ): Result<CommandReturnValue> {
    if (!aggregate) {
      return err({
        kind: "BadRequest",
        message: "Cannot update a valuation on a non-existent asset.",
      });
    }

    const dataToUpdate: Partial<{ date: string; value: Money }> = {};
    if (payload.date) {
      dataToUpdate.date = payload.date;
    }
    if (payload.value) {
      dataToUpdate.value = Money.from(
        payload.value,
        aggregate.details.baseCurrency
      );
    }

    aggregate.updateValuation(payload.valuationId, dataToUpdate);

    const output: CommandReturnValue = {
      aggregate: aggregate,
      response: { valuationId: payload.valuationId },
    };
    return ok(output);
  }
}
