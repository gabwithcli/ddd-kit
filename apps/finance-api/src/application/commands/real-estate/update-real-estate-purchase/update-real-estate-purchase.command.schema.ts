import { z } from "zod";
import { realEstateCommandsListSchema } from "../real-estate.commands";

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
