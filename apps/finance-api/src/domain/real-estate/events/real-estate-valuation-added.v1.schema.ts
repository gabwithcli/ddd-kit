import { z } from "zod";

// Fired when a new formal valuation is added to the asset.
export const RealEstateValuationAddedV1Schema = z.object({
  id: z.string().describe("The aggregate ID"),
  valuation: z.object({
    id: z.string().describe("The valuation's own ID"),
    date: z.string(),
    value: z.object({
      amount: z.number(),
      currency: z.string(),
    }),
  }),
});
