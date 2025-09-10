import {
  CommandOutput,
  err,
  ICommand,
  ok,
  Result,
  SuccessResponse,
} from "ddd-kit";
import { z } from "zod";
import { RealEstate } from "../../../../domain/real-estate/real-estate.aggregate";
import { Money } from "../../../../domain/shared/money";
import { addAppraisalPayloadSchema } from "./add-appraisal.command.schema";

type CommandPayload = z.infer<typeof addAppraisalPayloadSchema>;
type CommandDependencies = { newId(): string };
type CommandResponse = SuccessResponse;
type CommandReturnValue = CommandOutput<RealEstate, CommandResponse>;

export class AddAppraisalCommand
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
        message: "Cannot add an appraisal to a non-existent asset.",
      });
    }

    const appraisalId = `appr_${this.deps.newId()}`;
    const value = Money.from(payload.value, aggregate.details.baseCurrency);

    aggregate.addAppraisal({ id: appraisalId, date: payload.date, value });

    const output: CommandReturnValue = {
      aggregate: aggregate,
      response: { id: appraisalId },
    };
    return ok(output);
  }
}
