// apps/finance-api/src/application/commands/real-estate/delete/delete.command.ts

import { CommandOutput, ICommand, ok, Result } from "@acme/sdk-lite";
import z from "zod";
import { RealEstate } from "../../../../domain/real-estate/real-estate.aggregate";
import { deleteRealEstatePayloadSchema } from "./delete.schema";

// The full payload for the command's execute method, including the userId.
type CommandPayload = z.infer<typeof deleteRealEstatePayloadSchema> & {
  userId: string;
};

// A simple success response.
type CommandResponse = { id: string; ok: true };

// This command needs to know the current time to mark the asset as deleted.
type CommandDependencies = {
  now(): Date;
};

export class DeleteRealEstateCommand
  implements ICommand<CommandPayload, CommandResponse, RealEstate>
{
  constructor(private readonly deps: CommandDependencies) {}

  public execute(
    payload: CommandPayload,
    aggregate?: RealEstate
  ): Result<CommandOutput<RealEstate, CommandResponse>> {
    // The command handler will ensure the aggregate is loaded. If it's not
    // found, this `execute` method won't even be called.
    if (!aggregate) {
      // This is a defensive check; should be unreachable in the current design.
      throw new Error("Cannot delete a RealEstate that does not exist.");
    }

    // **Authorization Check:** This is an application-layer concern.
    // The domain model only cares about its internal consistency, not who is
    // making the request. We check for ownership here.
    if (aggregate.userId !== payload.userId) {
      // You should return a structured error here, for now we throw
      throw new Error("Forbidden: You do not own this asset.");
    }

    // We orchestrate the call to the domain model, passing the current time.
    aggregate.delete(this.deps.now());

    // On success, we return the mutated aggregate and a success response.
    return ok({
      aggregate: aggregate,
      response: { id: aggregate.id, ok: true },
      events: aggregate.pullEvents(),
    });
  }
}
