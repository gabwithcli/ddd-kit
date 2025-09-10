import {
  CommandOutput,
  createAggregateId,
  ICommand,
  ok,
  Result,
} from "ddd-kit";
import { z } from "zod";
import { RealEstate } from "../../../../domain/real-estate/real-estate.aggregate";
import { Address } from "../../../../domain/real-estate/types";
import { Money } from "../../../../domain/shared/money";
import { createRealEstateAssetPayloadSchema } from "./create-real-estate-asset.command.schema";

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

    const newId = createAggregateId<"RealEstate">(this.deps.newId(), "re");
    const createdAt = this.deps.now();

    const newAggregate = RealEstate.createAsset({
      id: newId,
      userId: payload.userId,
      details: {
        name: payload.details.name,
        address: Address.from(payload.details.address),
        notes: payload.details.notes,
        baseCurrency: payload.details.baseCurrency,
      },
      purchase: {
        date: payload.purchase.date,
        value: Money.from(payload.purchase.value, payload.details.baseCurrency),
      },
      createdAt: createdAt,
    });

    // The command's responsibility is now simpler. It just returns the aggregate
    // with the events still buffered inside. It no longer calls pullEvents().
    return ok({
      aggregate: newAggregate,
      response: { id: newAggregate.id },
    });
  }
}
