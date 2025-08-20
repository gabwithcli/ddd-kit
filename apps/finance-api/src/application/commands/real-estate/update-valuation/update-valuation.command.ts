import { z } from "zod";
import {
  CommandOutput,
  ICommand,
  ok,
  Result,
} from "../../../../../../../packages/ddd-kit/dist";
import { RealEstate } from "../../../../domain/real-estate/real-estate.aggregate";
import { Money } from "../../../../domain/shared/money";
import { updateValuationPayloadSchema } from "./update-valuation.schema";

type CommandPayload = z.infer<typeof updateValuationPayloadSchema>;
type CommandResponse = { valuationId: string; ok: true };

export class UpdateValuationCommand
  implements ICommand<CommandPayload, CommandResponse, RealEstate>
{
  public execute(
    payload: CommandPayload,
    aggregate?: RealEstate
  ): Result<CommandOutput<RealEstate, CommandResponse>> {
    if (!aggregate) {
      throw new Error("Cannot update a valuation on a non-existent asset.");
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
      response: { valuationId: payload.valuationId, ok: true },
      events: aggregate.pullEvents(),
    });
  }
}
