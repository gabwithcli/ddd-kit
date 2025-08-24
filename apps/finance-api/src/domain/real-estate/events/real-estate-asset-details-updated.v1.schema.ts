import { z } from "zod";

// Fired when high-level details of the asset (like name or address) are changed.
export const RealEstateAssetDetailsUpdatedV1Schema = z.object({
  id: z.string().describe("The aggregate ID"),
  changes: z.object({
    name: z.string().optional(),
    address: z
      .object({
        line1: z.string(),
        line2: z.string().optional(),
        postalCode: z.string(),
        city: z.string(),
        state: z.string().optional(),
        country: z.string(),
      })
      .optional(),
    notes: z.string().optional(),
  }),
});
