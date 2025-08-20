import { CommandOutput, ICommand, ok, Result } from "@acme/sdk-lite";
import { z } from "zod";
import { RealEstate } from "../../../../domain/real-estate/real-estate.aggregate";
import { Money } from "../../../../domain/shared/money";
import { addAppraisalPayloadSchema } from "./add-appraisal.schema";

type CommandPayload = z.infer<typeof addAppraisalPayloadSchema>;

type CommandResponse = { appraisalId: string };

type CommandDependencies = {
  newId(): string;
};

// This command is now highly focused: it only knows how to add an appraisal.
export class AddAppraisalCommand
  implements ICommand<CommandPayload, CommandResponse, RealEstate>
{
  constructor(private readonly deps: CommandDependencies) {}

  public execute(
    payload: CommandPayload,
    aggregate?: RealEstate
  ): Result<CommandOutput<RealEstate, CommandResponse>> {
    if (!aggregate) {
      throw new Error("Cannot add an appraisal to a non-existent asset.");
    }

    // 1. Generate the unique ID for the new Valuation entity.
    const valuationId = `val_${this.deps.newId()}`;

    // 2. Create the Money value object.
    const value = Money.from(payload.value, aggregate.details.baseCurrency);

    // 3. Directly call the specific domain method. No conditional logic needed!
    aggregate.addAppraisal({ id: valuationId, date: payload.date, value });

    // 4. Return the result.
    return ok({
      aggregate: aggregate,
      response: { appraisalId: valuationId },
      events: aggregate.pullEvents(),
    });
  }
}
