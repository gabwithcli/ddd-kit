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
import { deleteValuationPayloadSchema } from "./delete-valuation.command.schema";

type CommandPayload = z.infer<typeof deleteValuationPayloadSchema>;
type CommandResponse = SuccessResponse;
type CommandReturnValue = CommandOutput<RealEstate, CommandResponse>;
const { ok, err } = createCommandResultHelpers<CommandReturnValue, EdgeError>();

export class DeleteValuationCommand
  implements ICommand<CommandPayload, CommandResponse, RealEstate>
{
  public execute(
    payload: CommandPayload,
    aggregate?: RealEstate
  ): Result<CommandReturnValue> {
    if (!aggregate) {
      return err({
        kind: "BadRequest",
        message: "Cannot delete a valuation on a non-existent asset.",
      });
    }

    aggregate.removeValuation(payload.valuationId);

    return ok({
      aggregate: aggregate,
      response: { id: payload.valuationId },
    });
  }
}
