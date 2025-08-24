import { z } from "zod";

// Recorded when a formal valuation is removed from the asset.
export const RealEstateValuationRemovedV1Schema = z.object({
  id: z.string().describe("The aggregate ID"),
  valuationId: z.string().describe("The ID of the removed valuation"),
});
