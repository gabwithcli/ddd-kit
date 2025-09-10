import {
  CommandOutput,
  createCommandResultHelpers,
  EdgeError,
  ICommand,
  Result,
  SuccessResponse,
} from "ddd-kit";
import { z } from "zod";
import { RealEstate } from "../../../../domain/real-estate/real-estate.aggregate";
import { Money } from "../../../../domain/shared/money";
import { updateValuationPayloadSchema } from "./update-valuation.command.schema";

type CommandPayload = z.infer<typeof updateValuationPayloadSchema>;
type CommandResponse = SuccessResponse;
type CommandReturnValue = CommandOutput<RealEstate, CommandResponse>;
const { ok, err } = createCommandResultHelpers<CommandReturnValue, EdgeError>();

export class UpdateValuationCommand
  implements ICommand<CommandPayload, CommandResponse, RealEstate>
{
  public execute(
    payload: CommandPayload,
    aggregate?: RealEstate
  ): Result<CommandReturnValue, EdgeError> {
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

    return ok({
      aggregate: aggregate,
      response: { id: payload.valuationId, ok: true },
    });
  }
}
