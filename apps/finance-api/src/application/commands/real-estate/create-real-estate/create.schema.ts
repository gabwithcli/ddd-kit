import z from "zod";
import { realEstateCommandsListSchema } from "../commands.names";

export const createRealEstatePayloadSchema = z.object({
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

export const createRealEstateCommandSchema = z.object({
  command: z.literal(realEstateCommandsListSchema.enum["create-real-estate"]),
  payload: createRealEstatePayloadSchema,
});

export type CreateRealEstateCommand = z.infer<
  typeof createRealEstateCommandSchema
>;
export type CreateRealEstateCommandPayload = CreateRealEstateCommand["payload"];
