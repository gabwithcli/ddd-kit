import { z } from "zod";

// --- Command Names ---
// A single, comprehensive list of all command names for this aggregate.
export const realEstateCommandsList = [
  // real-estate (root) commands
  "create-real-estate-asset",
  "update-real-estate-details",
  "update-real-estate-purchase",
  "delete-real-estate-asset",
  // real-estate (child) commands
  // -- appraisals
  "add-appraisal",
  "update-appraisal",
  "delete-appraisal",
  // -- valuations
  "add-valuation",
  "update-valuation",
  "delete-valuation",
] as const;

export const realEstateCommandsListSchema = z.enum(realEstateCommandsList);
export type RealEstateCommandsList = z.infer<
  typeof realEstateCommandsListSchema
>;
