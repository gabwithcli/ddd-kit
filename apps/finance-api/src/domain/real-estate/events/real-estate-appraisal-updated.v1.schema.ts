import { z } from "zod";

// Recorded when an existing appraisal's date or value is changed.
export const RealEstateAppraisalUpdatedV1Schema = z.object({
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
