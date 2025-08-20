import { CommandOutput, ICommand, ok, Result } from "@acme/ddd-kit";
import { z } from "zod";
import { RealEstate } from "../../../../domain/real-estate/real-estate.aggregate";
import { deleteAppraisalPayloadSchema } from "./delete-appraisal.schema";

type CommandPayload = z.infer<typeof deleteAppraisalPayloadSchema>;
type CommandResponse = { appraisalId: string; ok: true };

export class DeleteAppraisalCommand
  implements ICommand<CommandPayload, CommandResponse, RealEstate>
{
  public execute(
    payload: CommandPayload,
    aggregate?: RealEstate
  ): Result<CommandOutput<RealEstate, CommandResponse>> {
    if (!aggregate) {
      throw new Error("Cannot delete an appraisal on a non-existent asset.");
    }

    aggregate.removeAppraisal(payload.appraisalId);

    return ok({
      aggregate: aggregate,
      response: { appraisalId: payload.appraisalId, ok: true },
      events: aggregate.pullEvents(),
    });
  }
}
