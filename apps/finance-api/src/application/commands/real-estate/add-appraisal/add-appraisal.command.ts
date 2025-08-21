import { CommandOutput, ICommand, ok, Result } from "ddd-kit";
import { z } from "zod";
import { RealEstate } from "../../../../domain/real-estate/real-estate.aggregate";
import { Money } from "../../../../domain/shared/money";
import { addAppraisalPayloadSchema } from "./add-appraisal.schema";

type CommandPayload = z.infer<typeof addAppraisalPayloadSchema>;

type CommandResponse = { appraisalId: string };

type CommandDependencies = { newId(): string };

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

    const appraisalId = `appr_${this.deps.newId()}`;
    const value = Money.from(payload.value, aggregate.details.baseCurrency);

    aggregate.addAppraisal({ id: appraisalId, date: payload.date, value });

    return ok({
      aggregate: aggregate,
      response: { appraisalId: appraisalId },
      events: aggregate.pullEvents(),
    });
  }
}
