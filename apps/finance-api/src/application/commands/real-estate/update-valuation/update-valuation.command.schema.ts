import { z } from "zod";
import { realEstateCommandsListSchema } from "../real-estate.commands";

export const updateValuationPayloadSchema = z
  .object({
    id: z.string().min(1, "Real estate asset ID is required"),
    valuationId: z.string().min(1, "Valuation ID is required"),
    date: z
      .string()
      .date("Must be a valid date string (YYYY-MM-DD)")
      .optional(),
    value: z.number().positive("Value must be a positive number").optional(),
  })
  .refine((data) => data.date || data.value, {
    message: "At least one field (date or value) must be provided for update.",
  });

export const updateValuationCommandSchema = z.object({
  command: z.literal(realEstateCommandsListSchema.enum["update-valuation"]),
  payload: updateValuationPayloadSchema,
});

export type UpdateValuationCommand = z.infer<
  typeof updateValuationCommandSchema
>;
export type UpdateValuationCommandPayload = UpdateValuationCommand["payload"];
