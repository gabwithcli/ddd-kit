import { CommandOutput, err, ICommand, ok, Result } from "ddd-kit";
import { z } from "zod";
import { RealEstate } from "../../../../domain/real-estate/real-estate.aggregate";
import { Address } from "../../../../domain/real-estate/types";
import { updateRealEstateDetailsPayloadSchema } from "./update-real-estate-details.command.schema";

type CommandPayload = z.infer<typeof updateRealEstateDetailsPayloadSchema>;
type CommandResponse = { id: string };
type CommandReturnValue = CommandOutput<RealEstate, CommandResponse>;

export class UpdateRealEstateDetailsCommand
  implements ICommand<CommandPayload, CommandResponse, RealEstate>
{
  public execute(
    payload: CommandPayload,
    aggregate?: RealEstate
  ): Result<CommandReturnValue> {
    if (!aggregate) {
      return err({
        kind: "BadRequest",
        message: "Cannot update details on a non-existent asset.",
      });
    }

    const { id, ...details } = payload;

    const detailsToUpdate = {
      name: details.name,
      notes: details.notes,
      address: details.address ? Address.from(details.address) : undefined,
    };

    aggregate.updateDetails(detailsToUpdate);

    const output: CommandReturnValue = {
      aggregate: aggregate,
      response: { id: aggregate.id },
    };
    return ok(output);
  }
}
