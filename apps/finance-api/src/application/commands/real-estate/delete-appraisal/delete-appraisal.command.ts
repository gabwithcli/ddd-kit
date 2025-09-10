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
import { deleteAppraisalPayloadSchema } from "./delete-appraisal.command.schema";

type CommandPayload = z.infer<typeof deleteAppraisalPayloadSchema>;
type CommandResponse = SuccessResponse;
type CommandReturnValue = CommandOutput<RealEstate, CommandResponse>;
const { ok, err } = createCommandResultHelpers<CommandReturnValue, EdgeError>();

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

    return ok({
      aggregate: aggregate,
      response: { id: payload.appraisalId },
    });
  }
}
