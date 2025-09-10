import {
  CommandOutput,
  err,
  ErrorResponseSchema,
  ICommand,
  ok,
  Result,
  SuccessResponseSchema,
} from "ddd-kit";
import { z } from "zod";
import { RealEstate } from "../../../../domain/real-estate/real-estate.aggregate";
import { Money } from "../../../../domain/shared/money";
import { updateRealEstatePurchasePayloadSchema } from "./update-real-estate-purchase.command.schema";

type CommandPayload = z.infer<typeof updateRealEstatePurchasePayloadSchema>;
type CommandResponse = typeof SuccessResponseSchema;
type CommandReturnValue = CommandOutput<RealEstate, CommandResponse>;

export class UpdateRealEstatePurchaseCommand
  implements ICommand<CommandPayload, CommandResponse, RealEstate>
{
  public execute(
    payload: CommandPayload,
    aggregate?: RealEstate
  ): Result<CommandReturnValue> {
    if (!aggregate) {
      const error: typeof ErrorResponseSchema = {
        // @ts-expect-error
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
      // @ts-expect-error
      response: { id: aggregate.id },
    };
    return ok(output);
  }
}
