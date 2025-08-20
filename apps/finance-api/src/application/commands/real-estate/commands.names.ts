import { z } from "zod";

export const realEstateCommandsList = [
  // real-estate (root) commands
  "create-real-estate-asset",
  // "update-real-estate-asset",
  "delete-real-estate-asset",
  "add-appraisal",
  // "edit-price-update",
  // "delete-price-update",
] as const;

export const realEstateCommandsListSchema = z.enum(realEstateCommandsList);

export type RealEstateCommandsList = z.infer<
  typeof realEstateCommandsListSchema
>;
