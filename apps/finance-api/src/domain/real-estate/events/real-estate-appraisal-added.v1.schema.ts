import { z } from "zod";

// This file defines the explicit "V1" contract for the RealEstateAppraisalAdded event.
export const RealEstateAppraisalAddedV1Schema = z.object({
  id: z.string().describe("The aggregate ID"),
  appraisal: z.object({
    id: z.string().describe("The appraisal's own ID"),
    date: z.string(),
    value: z.object({
      amount: z.number(),
      currency: z.string(),
    }),
  }),
});
