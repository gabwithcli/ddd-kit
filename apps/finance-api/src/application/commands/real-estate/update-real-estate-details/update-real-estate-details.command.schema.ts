import { z } from "zod";
import { realEstateCommandsListSchema } from "../real-estate.commands";

const addressSchema = z.object({
  line1: z.string().min(1, "Address line1 is required"),
  line2: z.string().optional(),
  postalCode: z.string().min(1, "Postal code is required"),
  city: z.string().min(1, "City is required"),
  state: z.string().optional(),
  country: z.string().min(1, "Country is required"),
});

export const updateRealEstateDetailsPayloadSchema = z
  .object({
    id: z.string().min(1, "Real estate asset ID is required"),
    name: z.string().min(1, "Name cannot be empty").optional(),
    address: addressSchema.optional(),
    notes: z.string().optional(),
  })
  .refine((data) => data.name || data.address || data.notes !== undefined, {
    message:
      "At least one field (name, address, or notes) must be provided for update.",
  });

export const updateRealEstateDetailsCommandSchema = z.object({
  command: z.literal(
    realEstateCommandsListSchema.enum["update-real-estate-details"]
  ),
  payload: updateRealEstateDetailsPayloadSchema,
});

export type UpdateRealEstateDetailsCommand = z.infer<
  typeof updateRealEstateDetailsCommandSchema
>;
export type UpdateRealEstateDetailsCommandPayload =
  UpdateRealEstateDetailsCommand["payload"];
