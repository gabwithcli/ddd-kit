import {
  CommandOutput,
  createAggregateId,
  err,
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
type CommandDependencies = {
  newId(): string;
  now(): Date;
};
type CommandResponse = { id: string };
type CommandReturnValue = CommandOutput<RealEstate, CommandResponse>;

export class CreateRealEstateAssetCommand
  implements ICommand<CommandPayload, CommandResponse, RealEstate>
{
  constructor(private readonly deps: CommandDependencies) {}

  public execute(
    payload: CommandPayload,
    aggregate?: RealEstate
  ): Result<CommandReturnValue> {
    if (aggregate) {
      return err({
        kind: "BadRequest",
        message: "Cannot create a RealEstate asset that already exists.",
      });
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

    const output: CommandReturnValue = {
      aggregate: newAggregate,
      response: { id: newAggregate.id },
    };
    return ok(output);
  }
}
