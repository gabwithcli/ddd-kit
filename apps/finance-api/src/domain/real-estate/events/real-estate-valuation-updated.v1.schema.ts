import { z } from "zod";

// Recorded when an existing valuation's date or value is changed.
export const RealEstateValuationUpdatedV1Schema = z.object({
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
