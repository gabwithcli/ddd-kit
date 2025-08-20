import { CommandOutput, ICommand, ok, Result } from "@acme/sdk-lite";
import { z } from "zod";
import { RealEstate } from "../../../../domain/real-estate/real-estate.aggregate";
import { Address } from "../../../../domain/real-estate/types";
import { updateRealEstateDetailsPayloadSchema } from "./update-real-estate-details.schema";

type CommandPayload = z.infer<typeof updateRealEstateDetailsPayloadSchema>;
type CommandResponse = { id: string; ok: true };

export class UpdateRealEstateDetailsCommand
  implements ICommand<CommandPayload, CommandResponse, RealEstate>
{
  public execute(
    payload: CommandPayload,
    aggregate?: RealEstate
  ): Result<CommandOutput<RealEstate, CommandResponse>> {
    if (!aggregate) {
      throw new Error("Cannot update details on a non-existent asset.");
    }

    // 1. Separate the aggregate ID from the data to be updated.
    const { id, ...details } = payload;

    // 2. Prepare the data for the aggregate, creating Value Objects as needed.
    const detailsToUpdate = {
      name: details.name,
      notes: details.notes,
      address: details.address ? Address.of(details.address) : undefined,
    };

    // 3. Call the aggregate method.
    aggregate.updateDetails(detailsToUpdate);

    return ok({
      aggregate: aggregate,
      response: { id: payload.id, ok: true },
      events: aggregate.pullEvents(),
    });
  }
}
