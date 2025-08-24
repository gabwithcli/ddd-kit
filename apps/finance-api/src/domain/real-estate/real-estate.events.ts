import { z } from "zod";

// Import all individual, versioned event schemas.
import { RealEstateAppraisalAddedV1Schema } from "./events/real-estate-appraisal-added.v1.schema";
import { RealEstateAppraisalRemovedV1Schema } from "./events/real-estate-appraisal-removed.v1.schema";
import { RealEstateAppraisalUpdatedV1Schema } from "./events/real-estate-appraisal-updated.v1.schema";
import { RealEstateAssetCreatedV1Schema } from "./events/real-estate-asset-created.v1.schema";
import { RealEstateAssetDeletedV1Schema } from "./events/real-estate-asset-deleted.v1.schema";
import { RealEstateAssetDetailsUpdatedV1Schema } from "./events/real-estate-asset-details-updated.v1.schema";
import { RealEstateAssetPurchaseUpdatedV1Schema } from "./events/real-estate-asset-purchase-updated.v1.schema";
import { RealEstateValuationAddedV1Schema } from "./events/real-estate-valuation-added.v1.schema";
import { RealEstateValuationRemovedV1Schema } from "./events/real-estate-valuation-removed.v1.schema";
import { RealEstateValuationUpdatedV1Schema } from "./events/real-estate-valuation-updated.v1.schema";

// This reusable schema defines the structure of our event metadata.
export const EventMetaV1Schema = z.object({
  version: z.literal(1).describe("The version of the event's data schema"),
  timestamp: z.date(),
});

// The event names now explicitly include the version number with an underscore.
export const realEstateEventsList = [
  // real-estate (root) events
  "RealEstateAssetCreated_V1",
  "RealEstateAssetDeleted_V1",
  "RealEstateAssetDetailsUpdated_V1",
  "RealEstateAssetPurchaseUpdated_V1",
  // real-estate (child) events
  // -- appraisals
  "RealEstateAppraisalAdded_V1",
  "RealEstateAppraisalUpdated_V1",
  "RealEstateAppraisalRemoved_V1",
  // -- valuations
  "RealEstateValuationAdded_V1",
  "RealEstateValuationUpdated_V1",
  "RealEstateValuationRemoved_V1",
] as const;

export const RealEstateEventNamesSchema = z.enum(realEstateEventsList);

// We now add the `meta: EventMetaV1Schema` to every object in the union.
// This ensures the inferred `RealEstateEvent` type matches the objects you create.
export const RealEstateEventSchema = z.discriminatedUnion("type", [
  // Root Events
  z.object({
    type: z.literal(RealEstateEventNamesSchema.enum.RealEstateAssetCreated_V1),
    data: RealEstateAssetCreatedV1Schema,
    meta: EventMetaV1Schema,
  }),
  z.object({
    type: z.literal(RealEstateEventNamesSchema.enum.RealEstateAssetDeleted_V1),
    data: RealEstateAssetDeletedV1Schema,
    meta: EventMetaV1Schema,
  }),
  z.object({
    type: z.literal(
      RealEstateEventNamesSchema.enum.RealEstateAssetDetailsUpdated_V1
    ),
    data: RealEstateAssetDetailsUpdatedV1Schema,
    meta: EventMetaV1Schema,
  }),
  z.object({
    type: z.literal(
      RealEstateEventNamesSchema.enum.RealEstateAssetPurchaseUpdated_V1
    ),
    data: RealEstateAssetPurchaseUpdatedV1Schema,
    meta: EventMetaV1Schema,
  }),
  // Appraisal Events
  z.object({
    type: z.literal(
      RealEstateEventNamesSchema.enum.RealEstateAppraisalAdded_V1
    ),
    data: RealEstateAppraisalAddedV1Schema,
    meta: EventMetaV1Schema,
  }),
  z.object({
    type: z.literal(
      RealEstateEventNamesSchema.enum.RealEstateAppraisalUpdated_V1
    ),
    data: RealEstateAppraisalUpdatedV1Schema,
    meta: EventMetaV1Schema,
  }),
  z.object({
    type: z.literal(
      RealEstateEventNamesSchema.enum.RealEstateAppraisalRemoved_V1
    ),
    data: RealEstateAppraisalRemovedV1Schema,
    meta: EventMetaV1Schema,
  }),
  // Valuation Events
  z.object({
    type: z.literal(
      RealEstateEventNamesSchema.enum.RealEstateValuationAdded_V1
    ),
    data: RealEstateValuationAddedV1Schema,
    meta: EventMetaV1Schema,
  }),
  z.object({
    type: z.literal(
      RealEstateEventNamesSchema.enum.RealEstateValuationUpdated_V1
    ),
    data: RealEstateValuationUpdatedV1Schema,
    meta: EventMetaV1Schema,
  }),
  z.object({
    type: z.literal(
      RealEstateEventNamesSchema.enum.RealEstateValuationRemoved_V1
    ),
    data: RealEstateValuationRemovedV1Schema,
    meta: EventMetaV1Schema,
  }),
]);

// This inferred type will now correctly include the `meta` property.
export type RealEstateEvent = z.infer<typeof RealEstateEventSchema>;
export type RealEstateEventType = z.infer<typeof RealEstateEventNamesSchema>;
