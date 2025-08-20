// apps/finance-api/src/application/commands/real-estate/create/create.command.ts

import { CommandOutput, ICommand, ok, Result } from "@acme/sdk-lite";
import { z } from "zod";
import {
  pp,
  RealEstate,
} from "../../../../domain/real-estate/real-estate.aggregate";
import { Address } from "../../../../domain/real-estate/types";
import { createRealEstatePayloadSchema } from "./create.schema";

// The full payload for the command's execute method, including the userId.
type CommandPayload = z.infer<typeof createRealEstatePayloadSchema> & {
  userId: string;
};

type CommandResponse = { id: string };

type CommandDependencies = {
  newId(): string;
  now(): Date;
};

export class CreateRealEstateCommand
  implements ICommand<CommandPayload, CommandResponse, RealEstate>
{
  constructor(private readonly deps: CommandDependencies) {}

  public execute(
    payload: CommandPayload,
    aggregate?: RealEstate // Will be undefined for a create command
  ): Result<CommandOutput<RealEstate, CommandResponse>> {
    // A create command should never be called on an existing aggregate.
    if (aggregate) {
      throw new Error("Cannot create a RealEstate that already exists.");
    }

    // ## Refactoring Note ##
    // This is where the Command takes on its orchestration role (the "Project Manager").
    // It interacts with infrastructure-level dependencies (`newId`, `now`) to gather
    // all the necessary data *before* calling the domain model.

    // 1. Generate the unique ID for the new aggregate.
    // The domain model is no longer responsible for its own ID format or generation.
    const newId = `re_${this.deps.newId()}`;

    // 2. Get the current timestamp.
    // This is another infrastructure concern handled here, not in the aggregate.
    const createdAt = this.deps.now();

    // 3. Call the refactored aggregate factory.
    // We now pass the generated ID and timestamp as plain data. The aggregate's
    // `create` method is now a pure function, focused solely on enforcing
    // business rules on the data it receives.
    const newAggregate = RealEstate.createAsset({
      id: newId,
      userId: payload.userId,
      details: {
        name: payload.details.name,
        address: Address.of(payload.details.address),
        notes: payload.details.notes,
        baseCurrency: payload.details.baseCurrency,
      },
      purchase: pp(
        payload.purchase.date,
        payload.purchase.value,
        payload.details.baseCurrency
      ),
      createdAt: createdAt, // Pass the generated timestamp.
    });

    // The rest of the logic is unchanged.
    // On success, we wrap the new aggregate and response DTO in a `Result.ok`.
    return ok({
      aggregate: newAggregate,
      response: { id: newAggregate.id },
      events: newAggregate.pullEvents(),
    });
  }
}
