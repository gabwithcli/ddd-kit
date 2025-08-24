import z from "zod";
import { realEstateCommandsListSchema } from "../real-estate.commands";

export const createRealEstateAssetPayloadSchema = z.object({
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
    date: z.string().date("Must be a valid date string (YYYY-MM-DD)"),
    value: z.number().positive("Value must be a positive number"),
  }),
});

export const createRealEstateAssetCommandSchema = z.object({
  command: z.literal(
    realEstateCommandsListSchema.enum["create-real-estate-asset"]
  ),
  payload: createRealEstateAssetPayloadSchema,
});

export type CreateRealEstateAssetCommand = z.infer<
  typeof createRealEstateAssetCommandSchema
>;
export type CreateRealEstateAssetCommandPayload =
  CreateRealEstateAssetCommand["payload"];
