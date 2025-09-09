// This is a TypeScript declaration file. Its purpose is to augment existing types.
// Here, we are "plugging in" our application's specific events into the generic
// AggregateEvents interface from the ddd-kit library.

import type { RealEstateAppraisalAdded } from "./real-estate/events/real-estate-appraisal-added.event";
import type { RealEstateAppraisalRemoved } from "./real-estate/events/real-estate-appraisal-removed.event";
import type { RealEstateAppraisalUpdated } from "./real-estate/events/real-estate-appraisal-updated.event";
import type { RealEstateAssetCreated } from "./real-estate/events/real-estate-asset-created.event";
import type { RealEstateAssetDeleted } from "./real-estate/events/real-estate-asset-deleted.event";
import type { RealEstateAssetDetailsUpdated } from "./real-estate/events/real-estate-asset-details-updated.event";
import type { RealEstateAssetPurchaseUpdated } from "./real-estate/events/real-estate-asset-purchase-updated.event";
import type { RealEstateValuationAdded } from "./real-estate/events/real-estate-valuation-added.event";
import type { RealEstateValuationRemoved } from "./real-estate/events/real-estate-valuation-removed.event";
import type { RealEstateValuationUpdated } from "./real-estate/events/real-estate-valuation-updated.event";

declare module "ddd-kit/domain" {
  // This tells TypeScript to add properties to the existing AggregateEvents interface
  export interface AggregateEvents {
    // The key is the event's unique type string, and the value is the event's class type.
    RealEstateAssetCreated_V1: RealEstateAssetCreated;
    RealEstateAssetDetailsUpdated_V1: RealEstateAssetDetailsUpdated;
    RealEstateAssetPurchaseUpdated_V1: RealEstateAssetPurchaseUpdated;
    RealEstateAssetDeleted_V1: RealEstateAssetDeleted;
    RealEstateAppraisalAdded_V1: RealEstateAppraisalAdded;
    RealEstateAppraisalUpdated_V1: RealEstateAppraisalUpdated;
    RealEstateAppraisalRemoved_V1: RealEstateAppraisalRemoved;
    RealEstateValuationAdded_V1: RealEstateValuationAdded;
    RealEstateValuationUpdated_V1: RealEstateValuationUpdated;
    RealEstateValuationRemoved_V1: RealEstateValuationRemoved;
  }
}
