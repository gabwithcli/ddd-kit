import { CommandOutput, ICommand, ok, Result } from "ddd-kit";
import z from "zod";
import { RealEstate } from "../../../../domain/real-estate/real-estate.aggregate";
import { deleteRealEstateAssetPayloadSchema } from "./delete-real-estate-asset.command.schema";

type CommandPayload = z.infer<typeof deleteRealEstateAssetPayloadSchema> & {
  userId: string;
};
type CommandResponse = { id: string; ok: true };
type CommandDependencies = {
  now(): Date;
};

export class DeleteRealEstateAssetCommand
  implements ICommand<CommandPayload, CommandResponse, RealEstate>
{
  constructor(private readonly deps: CommandDependencies) {}

  public execute(
    payload: CommandPayload,
    aggregate?: RealEstate
  ): Result<CommandOutput<RealEstate, CommandResponse>> {
    if (!aggregate) {
      throw new Error("Cannot delete a RealEstate that does not exist.");
    }

    // Application-layer authorization check.
    if (aggregate.userId !== payload.userId) {
      throw new Error("Forbidden: You do not own this asset.");
    }

    // 1. Call the aggregate method, passing the current time.
    aggregate.deleteAsset(this.deps.now());

    return ok({
      aggregate: aggregate,
      response: { id: aggregate.id, ok: true },
    });
  }
}
