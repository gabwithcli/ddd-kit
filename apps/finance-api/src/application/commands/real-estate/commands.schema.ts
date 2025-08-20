import { z } from "zod";
import { addAppraisalCommandSchema } from "./add-appraisal/add-appraisal.schema";
import { addValuationCommandSchema } from "./add-valuation/add-valuation.schema";
import { createRealEstateAssetCommandSchema } from "./create-real-estate-asset/create-real-estate-asset.schema";
import { deleteAppraisalCommandSchema } from "./delete-appraisal/delete-appraisal.schema";
import { deleteRealEstateAssetCommandSchema } from "./delete-real-estate-asset/delete-real-estate-asset.schema";
import { deleteValuationCommandSchema } from "./delete-valuation/delete-valuation.schema";
import { updateAppraisalCommandSchema } from "./update-appraisal/update-appraisal.schema";
import { updateRealEstateDetailsCommandSchema } from "./update-real-estate-details/update-real-estate-details.schema";
import { updateRealEstatePurchaseCommandSchema } from "./update-real-estate-purchase/update-real-estate-purchase.schema";
import { updateValuationCommandSchema } from "./update-valuation/update-valuation.schema";

/**
 * A discriminated union of all possible command schemas for the RealEstate aggregate.
 * This allows for type-safe validation and parsing of any incoming command request.
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
