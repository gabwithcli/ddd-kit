import { CommandOutput, ICommand, ok, Result } from "ddd-kit";
import { z } from "zod";
import { RealEstate } from "../../../../domain/real-estate/real-estate.aggregate";
import { Money } from "../../../../domain/shared/money";
import { updateRealEstatePurchasePayloadSchema } from "./update-real-estate-purchase.schema";

type CommandPayload = z.infer<typeof updateRealEstatePurchasePayloadSchema>;
type CommandResponse = { id: string; ok: true };

export class UpdateRealEstatePurchaseCommand
  implements ICommand<CommandPayload, CommandResponse, RealEstate>
{
  public execute(
    payload: CommandPayload,
    aggregate?: RealEstate
  ): Result<CommandOutput<RealEstate, CommandResponse>> {
    if (!aggregate) {
      throw new Error("Cannot update purchase on a non-existent asset.");
    }

    // 1. Prepare the partial data, creating a Money Value Object if needed.
    const dataToUpdate: Partial<{ date: string; value: Money }> = {};
    if (payload.date) {
      dataToUpdate.date = payload.date;
    }
    if (payload.value) {
      // The currency is an immutable part of the aggregate's context.
      dataToUpdate.value = Money.from(
        payload.value,
        aggregate.details.baseCurrency
      );
    }

    // 2. Call the aggregate method to perform the update and run invariants.
    aggregate.updatePurchase(dataToUpdate);

    return ok({
      aggregate: aggregate,
      response: { id: payload.id, ok: true },
      events: aggregate.pullEvents(),
    });
  }
}
