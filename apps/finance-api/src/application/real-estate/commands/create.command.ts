// apps/finance-api/src/application/commands/real-estate/create.command.ts

import { CommandOutput, ICommand, ok, Result } from "@acme/sdk-lite";
import { z } from "zod";
import {
  pp,
  RealEstate,
} from "../../../domain/real-estate/real-estate.aggregate";
import { Address } from "../../../domain/real-estate/types";

// This schema defines just the data payload for the command.
export const CreateRealEstatePayloadSchema = z.object({
  details: z.object({
    name: z.string().min(1, "Name is required"),
    address: z.object({
      line1: z.string().min(1, "Address line1 is required"),
      line2: z.string().optional(),
      postalCode: z.string().min(1, "Postal code is required"),
      city: z.string().min(1, "City is required"),
      state: z.string().optional(),
      country: z.string().min(1, "Country is required"),
    }),
    notes: z.string().optional(),
    baseCurrency: z.string().length(3, "Use 3-letter currency code"),
  }),
  purchase: z.object({
    date: z.string(), // ISO date string
    value: z.number().positive(),
  }),
});

// The full payload for the command's execute method, including the userId.
type CommandPayload = z.infer<typeof CreateRealEstatePayloadSchema> & {
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
    aggregate?: RealEstate
  ): Result<CommandOutput<RealEstate, CommandResponse>> {
    if (aggregate) {
      throw new Error("Cannot create a RealEstate that already exists.");
    }

    // The aggregate's factory enforces all business invariants.
    const newAggregate = RealEstate.create({
      id: `re_${this.deps.newId()}`,
      userId: payload.userId, // userId is now passed directly
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
      now: () => this.deps.now().toISOString(),
    });

    // On success, we wrap the new aggregate and response DTO in a `Result.ok`.
    return ok({
      aggregate: newAggregate,
      response: { id: newAggregate.id },
      events: newAggregate.pullEvents(),
    });
  }
}
