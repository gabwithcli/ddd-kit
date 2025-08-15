import { z } from "zod";

export const realEstateCommandsList = [
  // real-estate (root) commands
  "create-real-estate",
  // "update-real-estate",
  // "delete-real-estate",
  // appraisal commands
  // "add-appraisal",
  // "edit-appraisal",
  // "remove-appraisal",
  // market-valuation commands
  // "add-market-valuation",
  // "edit-market-valuation",
  // "remove-market-valuation",
] as const;

export const realEstateCommandsListSchema = z.enum(realEstateCommandsList);

export type RealEstateCommandsList = z.infer<
  typeof realEstateCommandsListSchema
>;
