import { z } from "zod";
import { addAppraisalCommandSchema } from "./add-appraisal/add-appraisal.command.schema";
import { addValuationCommandSchema } from "./add-valuation/add-valuation.command.schema";
import { createRealEstateAssetCommandSchema } from "./create-real-estate-asset/create-real-estate-asset.command.schema";
import { deleteAppraisalCommandSchema } from "./delete-appraisal/delete-appraisal.command.schema";
import { deleteRealEstateAssetCommandSchema } from "./delete-real-estate-asset/delete-real-estate-asset.command.schema";
import { deleteValuationCommandSchema } from "./delete-valuation/delete-valuation.command.schema";
import { updateAppraisalCommandSchema } from "./update-appraisal/update-appraisal.command.schema";
import { updateRealEstateDetailsCommandSchema } from "./update-real-estate-details/update-real-estate-details.command.schema";
import { updateRealEstatePurchaseCommandSchema } from "./update-real-estate-purchase/update-real-estate-purchase.command.schema";
import { updateValuationCommandSchema } from "./update-valuation/update-valuation.command.schema";

// --- Master Command Schema ---
/**
 * A discriminated union of all possible command schemas for the RealEstate aggregate.
 * This allows for type-safe validation and parsing of any incoming command request
 * by using the `command` property as the discriminator.
 */
export const RealEstateCommandRequest = z.discriminatedUnion("command", [
  // Asset root commands
  createRealEstateAssetCommandSchema,
  updateRealEstateDetailsCommandSchema,
  updateRealEstatePurchaseCommandSchema,
  deleteRealEstateAssetCommandSchema,
  // Appraisal commands
  addAppraisalCommandSchema,
  updateAppraisalCommandSchema,
  deleteAppraisalCommandSchema,
  // Valuation commands
  addValuationCommandSchema,
  updateValuationCommandSchema,
  deleteValuationCommandSchema,
] as const);
