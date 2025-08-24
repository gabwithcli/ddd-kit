import { z } from "zod";

// This event is recorded when an asset is marked as deleted.
export const RealEstateAssetDeletedV1Schema = z.object({
  id: z.string().describe("The aggregate ID of the deleted asset"),
  at: z.date().describe("The timestamp when the deletion occurred"),
});
