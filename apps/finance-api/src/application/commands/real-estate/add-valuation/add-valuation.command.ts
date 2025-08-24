import { CommandOutput, ICommand, ok, Result } from "ddd-kit";
import { z } from "zod";
import { RealEstate } from "../../../../domain/real-estate/real-estate.aggregate";
import { Money } from "../../../../domain/shared/money";
import { addValuationPayloadSchema } from "./add-valuation.command.schema";

type CommandPayload = z.infer<typeof addValuationPayloadSchema>;
type CommandResponse = { valuationId: string };
type CommandDependencies = { newId(): string };

export class AddValuationCommand
  implements ICommand<CommandPayload, CommandResponse, RealEstate>
{
  constructor(private readonly deps: CommandDependencies) {}

  public execute(
    payload: CommandPayload,
    aggregate?: RealEstate
  ): Result<CommandOutput<RealEstate, CommandResponse>> {
    if (!aggregate) {
      throw new Error("Cannot add a valuation to a non-existent asset.");
    }

    const valuationId = `val_${this.deps.newId()}`;
    const value = Money.from(payload.value, aggregate.details.baseCurrency);

    aggregate.addValuation({ id: valuationId, date: payload.date, value });

    return ok({
      aggregate: aggregate,
      response: { valuationId: valuationId },
      events: aggregate.pullEvents(),
    });
  }
}
