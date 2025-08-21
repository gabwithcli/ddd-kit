import { z } from "zod";
import { realEstateCommandsListSchema } from "../commands.names";

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

// We create a sample payload that conforms to our Zod schema.
// This object will be used to pre-populate the request body in API documentation tools.
// It's a great way to provide a sensible default for anyone testing the endpoint.
export const updateValuationPayloadExample = {
  id: "re_1234567890",
  valuationId: "val_0987654321",
  date: "2023-10-26",
} satisfies UpdateValuationCommandPayload;
