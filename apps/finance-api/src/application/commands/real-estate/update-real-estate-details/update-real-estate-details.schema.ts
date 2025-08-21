import { z } from "zod";
import { realEstateCommandsListSchema } from "../commands.names";

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

// We create a sample payload that conforms to our Zod schema.
// This object will be used to pre-populate the request body in API documentation tools.
// It's a great way to provide a sensible default for anyone testing the endpoint.
export const updateRealEstateDetailsPayloadExample = {
  id: "re_1234567890",
  name: "Updated Real Estate Asset",
  address: {
    line1: "456 Updated Street",
    line2: "Suite 100",
    postalCode: "54321",
    city: "Updated City",
    state: "CA",
    country: "USA",
  },
  notes: "Updated notes about the asset",
} satisfies UpdateRealEstateDetailsCommandPayload;
