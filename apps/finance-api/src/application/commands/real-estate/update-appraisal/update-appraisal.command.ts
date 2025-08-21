import { CommandOutput, ICommand, ok, Result } from "ddd-kit";
import { z } from "zod";
import { RealEstate } from "../../../../domain/real-estate/real-estate.aggregate";
import { Money } from "../../../../domain/shared/money";
import { updateAppraisalPayloadSchema } from "./update-appraisal.schema";

type CommandPayload = z.infer<typeof updateAppraisalPayloadSchema>;
type CommandResponse = { appraisalId: string; ok: true };

export class UpdateAppraisalCommand
  implements ICommand<CommandPayload, CommandResponse, RealEstate>
{
  public execute(
    payload: CommandPayload,
    aggregate?: RealEstate
  ): Result<CommandOutput<RealEstate, CommandResponse>> {
    if (!aggregate) {
      throw new Error("Cannot update an appraisal on a non-existent asset.");
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

    aggregate.updateAppraisal(payload.appraisalId, dataToUpdate);

    return ok({
      aggregate: aggregate,
      response: { appraisalId: payload.appraisalId, ok: true },
      events: aggregate.pullEvents(),
    });
  }
}
