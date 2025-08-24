import { CommandOutput, ICommand, ok, Result } from "ddd-kit";
import { z } from "zod";
import { RealEstate } from "../../../../domain/real-estate/real-estate.aggregate";
import { deleteValuationPayloadSchema } from "./delete-valuation.command.schema";

type CommandPayload = z.infer<typeof deleteValuationPayloadSchema>;
type CommandResponse = { valuationId: string; ok: true };

export class DeleteValuationCommand
  implements ICommand<CommandPayload, CommandResponse, RealEstate>
{
  public execute(
    payload: CommandPayload,
    aggregate?: RealEstate
  ): Result<CommandOutput<RealEstate, CommandResponse>> {
    if (!aggregate) {
      throw new Error("Cannot delete a valuation on a non-existent asset.");
    }

    aggregate.removeValuation(payload.valuationId);

    return ok({
      aggregate: aggregate,
      response: { valuationId: payload.valuationId, ok: true },
      events: aggregate.pullEvents(),
    });
  }
}
