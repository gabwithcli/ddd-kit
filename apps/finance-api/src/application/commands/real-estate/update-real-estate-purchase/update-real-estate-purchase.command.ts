import {
  CommandOutput,
  err,
  ErrorResponse,
  ICommand,
  ok,
  Result,
  SuccessResponse,
} from "ddd-kit";
import { z } from "zod";
import { RealEstate } from "../../../../domain/real-estate/real-estate.aggregate";
import { Money } from "../../../../domain/shared/money";
import { updateRealEstatePurchasePayloadSchema } from "./update-real-estate-purchase.command.schema";

type CommandPayload = z.infer<typeof updateRealEstatePurchasePayloadSchema>;
type CommandResponse = SuccessResponse;
type CommandReturnValue = CommandOutput<RealEstate, CommandResponse>;

export class UpdateRealEstatePurchaseCommand
  implements ICommand<CommandPayload, CommandResponse, RealEstate>
{
  public execute(
    payload: CommandPayload,
    aggregate?: RealEstate
  ): Result<CommandReturnValue> {
    if (!aggregate) {
      const error: ErrorResponse = {
        kind: "BadRequest",
        message: "Cannot update purchase on a non-existent asset.",
      };
      return err(error);
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

    aggregate.updatePurchase(dataToUpdate);

    const output: CommandReturnValue = {
      aggregate: aggregate,
      response: { id: aggregate.id },
    };
    return ok(output);
  }
}
