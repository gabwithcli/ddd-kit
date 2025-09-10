import { CommandOutput, err, ICommand, ok, Result } from "ddd-kit";
import { z } from "zod";
import { RealEstate } from "../../../../domain/real-estate/real-estate.aggregate";
import { deleteAppraisalPayloadSchema } from "./delete-appraisal.command.schema";

type CommandPayload = z.infer<typeof deleteAppraisalPayloadSchema>;
type CommandResponse = { appraisalId: string };
type CommandReturnValue = CommandOutput<RealEstate, CommandResponse>;

export class DeleteAppraisalCommand
  implements ICommand<CommandPayload, CommandResponse, RealEstate>
{
  public execute(
    payload: CommandPayload,
    aggregate?: RealEstate
  ): Result<CommandReturnValue> {
    if (!aggregate) {
      return err({
        kind: "BadRequest",
        message: "Cannot delete an appraisal on a non-existent asset.",
      });
    }

    aggregate.removeAppraisal(payload.appraisalId);

    const output: CommandReturnValue = {
      aggregate: aggregate,
      response: { appraisalId: payload.appraisalId },
    };
    return ok(output);
  }
}
