import { z } from "zod";
import { realEstateCommandsListSchema } from "../real-estate.commands";

export const addValuationPayloadSchema = z.object({
  id: z.string().min(1, "Real estate asset ID is required"),
  date: z.string().date("Must be a valid date string (YYYY-MM-DD)"),
  value: z.number().positive("Value must be a positive number"),
});

export const addValuationCommandSchema = z.object({
  command: z.literal(realEstateCommandsListSchema.enum["add-valuation"]),
  payload: addValuationPayloadSchema,
});

export type AddValuationCommand = z.infer<typeof addValuationCommandSchema>;
export type AddValuationCommandPayload = AddValuationCommand["payload"];
