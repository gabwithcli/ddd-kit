import { CommandOutput, err, ICommand, ok, Result } from "ddd-kit";
import z from "zod";
import { RealEstate } from "../../../../domain/real-estate/real-estate.aggregate";
import { deleteRealEstateAssetPayloadSchema } from "./delete-real-estate-asset.command.schema";

type CommandPayload = z.infer<typeof deleteRealEstateAssetPayloadSchema> & {
  userId: string;
};
type CommandDependencies = {
  now(): Date;
};
type CommandResponse = { id: string };
type CommandReturnValue = CommandOutput<RealEstate, CommandResponse>;

export class DeleteRealEstateAssetCommand
  implements ICommand<CommandPayload, CommandResponse, RealEstate>
{
  constructor(private readonly deps: CommandDependencies) {}

  public execute(
    payload: CommandPayload,
    aggregate?: RealEstate
  ): Result<CommandReturnValue> {
    if (!aggregate) {
      return err({
        kind: "BadRequest",
        message: "Cannot delete a RealEstate that does not exist.",
      });
    }

    // Application-layer authorization check.
    if (aggregate.userId !== payload.userId) {
      return err({
        kind: "BadRequest",
        message: "Forbidden: You do not own this asset.",
      });
    }

    // 1. Call the aggregate method, passing the current time.
    aggregate.deleteAsset(this.deps.now());

    const output: CommandReturnValue = {
      aggregate: aggregate,
      response: { id: aggregate.id },
    };
    return ok(output);
  }
}
