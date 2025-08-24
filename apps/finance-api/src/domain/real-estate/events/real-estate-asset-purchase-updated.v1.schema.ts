import { z } from "zod";

// Fired when the original purchase information of the asset is corrected or updated.
export const RealEstateAssetPurchaseUpdatedV1Schema = z.object({
  id: z.string().describe("The aggregate ID"),
  purchase: z.object({
    date: z.string(),
    value: z.object({
      amount: z.number(),
      currency: z.string(),
    }),
  }),
});
