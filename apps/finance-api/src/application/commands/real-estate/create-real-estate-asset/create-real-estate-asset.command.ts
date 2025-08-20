import { CommandOutput, ICommand, ok, Result } from "@acme/ddd-kit";
import { z } from "zod";
import { RealEstate } from "../../../../domain/real-estate/real-estate.aggregate";
import { Address } from "../../../../domain/real-estate/types";
import { Money } from "../../../../domain/shared/money";
import { createRealEstateAssetPayloadSchema } from "./create-real-estate-asset.schema";

type CommandPayload = z.infer<typeof createRealEstateAssetPayloadSchema> & {
  userId: string;
};
type CommandResponse = { id: string };
type CommandDependencies = {
  newId(): string;
  now(): Date;
};

export class CreateRealEstateAssetCommand
  implements ICommand<CommandPayload, CommandResponse, RealEstate>
{
  constructor(private readonly deps: CommandDependencies) {}

  public execute(
    payload: CommandPayload,
    aggregate?: RealEstate
  ): Result<CommandOutput<RealEstate, CommandResponse>> {
    if (aggregate) {
      throw new Error("Cannot create a RealEstate asset that already exists.");
    }

    // 1. Generate the unique ID for the new aggregate.
    const newId = `re_${this.deps.newId()}`;
    const createdAt = this.deps.now();

    // 2. Call the aggregate's factory method with all the required data.
    const newAggregate = RealEstate.createAsset({
      id: newId,
      userId: payload.userId,
      details: {
        name: payload.details.name,
        address: Address.of(payload.details.address),
        notes: payload.details.notes,
        baseCurrency: payload.details.baseCurrency,
      },
      purchase: {
        date: payload.purchase.date,
        value: Money.from(payload.purchase.value, payload.details.baseCurrency),
      },
      createdAt: createdAt,
    });

    // 3. Return the new aggregate and the response DTO.
    return ok({
      aggregate: newAggregate,
      response: { id: newAggregate.id },
      events: newAggregate.pullEvents(),
    });
  }
}
