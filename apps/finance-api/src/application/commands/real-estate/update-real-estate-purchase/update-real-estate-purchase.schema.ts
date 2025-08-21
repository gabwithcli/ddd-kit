import { z } from "zod";
import { realEstateCommandsListSchema } from "../commands.names";

export const updateRealEstatePurchasePayloadSchema = z
  .object({
    id: z.string().min(1, "Real estate asset ID is required"),
    date: z
      .string()
      .date("Must be a valid date string (YYYY-MM-DD)")
      .optional(),
    value: z.number().positive("Value must be a positive number").optional(),
  })
  .refine((data) => data.date || data.value, {
    message: "At least one field (date or value) must be provided for update.",
  });

export const updateRealEstatePurchaseCommandSchema = z.object({
  command: z.literal(
    realEstateCommandsListSchema.enum["update-real-estate-purchase"]
  ),
  payload: updateRealEstatePurchasePayloadSchema,
});

export type UpdateRealEstatePurchaseCommand = z.infer<
  typeof updateRealEstatePurchaseCommandSchema
>;
export type UpdateRealEstatePurchaseCommandPayload =
  UpdateRealEstatePurchaseCommand["payload"];

// We create a sample payload that conforms to our Zod schema.
// This object will be used to pre-populate the request body in API documentation tools.
// It's a great way to provide a sensible default for anyone testing the endpoint.
export const updateRealEstatePurchasePayloadExample = {
  id: "re_1234567890",
  date: "2023-10-26",
  value: 500_000,
} satisfies UpdateRealEstatePurchaseCommandPayload;
