import { z } from "zod";

// Recorded when an appraisal is removed from the asset.
export const RealEstateAppraisalRemovedV1Schema = z.object({
  id: z.string().describe("The aggregate ID"),
  appraisalId: z.string().describe("The ID of the removed appraisal"),
});
