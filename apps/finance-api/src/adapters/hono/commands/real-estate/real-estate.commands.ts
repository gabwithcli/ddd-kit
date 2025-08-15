import z from "zod";
import { CreateRealEstatePayloadSchema } from "../../../../application/real-estate/commands/create.command";

// This Zod schema validates the generic command envelope from the client.
export const RealEstateCommandRequest = z.discriminatedUnion("command", [
  z.object({
    command: z.literal("createRealEstate"),
    payload: CreateRealEstatePayloadSchema,
  }),
  // ... schemas for other commands will be added here
]);


// ^^ move this into application/real-estate/** 

// also rename application to "modules"



