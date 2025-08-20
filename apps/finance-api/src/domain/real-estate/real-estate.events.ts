import { z } from "zod";

// 1. Define a list of all possible domain events this aggregate can produce.
export const realEstateEventsList = [
  // real-estate (root) events
  "RealEstateAssetCreated",
  "RealEstateAssetDeleted",
  "RealEstateAssetDetailsUpdated",
  "RealEstateAssetPurchaseUpdated",
  // real-estate (child) events
  // -- appraisals
  "RealEstateAppraisalAdded",
  "RealEstateAppraisalUpdated",
  "RealEstateAppraisalRemoved",
  // -- valuations
  "RealEstateValuationAdded",
  "RealEstateValuationUpdated",
  "RealEstateValuationRemoved",
] as const;

// 2. Create a Zod schema from the list for validation purposes.
export const realEstateEventsSchema = z.enum(realEstateEventsList);

// 3. Create a TypeScript type that our aggregate will use for type-safety.
export type RealEstateEvent = z.infer<typeof realEstateEventsSchema>;
