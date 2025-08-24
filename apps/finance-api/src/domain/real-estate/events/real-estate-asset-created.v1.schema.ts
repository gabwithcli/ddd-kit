import { z } from "zod";

// This file defines the explicit "V1" contract for the RealEstateAssetCreated event.
// It is a self-contained, versioned schema.
export const RealEstateAssetCreatedV1Schema = z.object({
  id: z.string(),
  userId: z.string(),
  details: z.object({
    name: z.string(),
    address: z.object({
      line1: z.string(),
      line2: z.string().optional(),
      postalCode: z.string(),
      city: z.string(),
      state: z.string().optional(),
      country: z.string(),
    }),
    notes: z.string().optional(),
    baseCurrency: z.string(),
  }),
  purchase: z.object({
    date: z.string(),
    value: z.object({
      amount: z.number(),
      currency: z.string(),
    }),
  }),
  at: z.date(),
});
