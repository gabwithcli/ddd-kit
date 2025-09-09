// ## File: apps/finance-api/src/infra/persistence/kurrent/real-estate.events.kurrent.ts

/**
 * ====================================================================================
 * RUNTIME Deserialization Map for Real Estate Events
 * ====================================================================================
 *
 * What is this file for?
 * ----------------------
 * This file provides a simple JavaScript object (`AllRealEstateEvents`) that maps an
 * event's type string (e.g., "RealEstateAssetCreated_V1") to its corresponding
 * class constructor (e.g., `RealEstateAssetCreated`).
 *
 * Why is this necessary?
 * ----------------------
 * When we use an event store like KurrentDB, we store events as plain JSON data.
 * When we read these events back, we get simple objects, not instances of our
 * rich, behavioral DomainEvent classes.
 *
 * The repository needs this map at RUNTIME to perform deserialization:
 * 1. It reads a raw event object: `{ type: "RealEstateAssetCreated_V1", data: {...} }`
 * 2. It looks up "RealEstateAssetCreated_V1" in this map to get the `RealEstateAssetCreated` class.
 * 3. It calls `new RealEstateAssetCreated(data)` to re-create the full class instance.
 *
 * Why not use `aggregate-events.ts`?
 * -------------------------------------
 * `aggregate-events.ts` defines a TypeScript `interface`. Interfaces are a
 * COMPILE-TIME construct for type-checking and are completely erased when the
 * code is compiled to JavaScript. They do not exist at runtime, so our running
 * application has nothing to look up. This file, in contrast, creates a real
 * JavaScript object that is available to our running code.
 */

import { RealEstateAppraisalAdded } from "src/domain/real-estate/events/real-estate-appraisal-added.event";
import { RealEstateAppraisalRemoved } from "src/domain/real-estate/events/real-estate-appraisal-removed.event";
import { RealEstateAppraisalUpdated } from "src/domain/real-estate/events/real-estate-appraisal-updated.event";
import { RealEstateAssetCreated } from "src/domain/real-estate/events/real-estate-asset-created.event";
import { RealEstateAssetDeleted } from "src/domain/real-estate/events/real-estate-asset-deleted.event";
import { RealEstateAssetDetailsUpdated } from "src/domain/real-estate/events/real-estate-asset-details-updated.event";
import { RealEstateAssetPurchaseUpdated } from "src/domain/real-estate/events/real-estate-asset-purchase-updated.event";
import { RealEstateValuationAdded } from "src/domain/real-estate/events/real-estate-valuation-added.event";
import { RealEstateValuationRemoved } from "src/domain/real-estate/events/real-estate-valuation-removed.event";
import { RealEstateValuationUpdated } from "src/domain/real-estate/events/real-estate-valuation-updated.event";

// We must import each event class directly from its source file to get access
// to the class constructor itself, which is a runtime value.

export const AllRealEstateEvents: Record<string, any> = {
  // We use the static `type` property from each class as the key.
  // This ensures that the key always matches the type string defined in the event class itself.
  [RealEstateAssetCreated.type]: RealEstateAssetCreated,
  [RealEstateAssetDetailsUpdated.type]: RealEstateAssetDetailsUpdated,
  [RealEstateAssetPurchaseUpdated.type]: RealEstateAssetPurchaseUpdated,
  [RealEstateAssetDeleted.type]: RealEstateAssetDeleted,
  [RealEstateAppraisalAdded.type]: RealEstateAppraisalAdded,
  [RealEstateAppraisalUpdated.type]: RealEstateAppraisalUpdated,
  [RealEstateAppraisalRemoved.type]: RealEstateAppraisalRemoved,
  [RealEstateValuationAdded.type]: RealEstateValuationAdded,
  [RealEstateValuationUpdated.type]: RealEstateValuationUpdated,
  [RealEstateValuationRemoved.type]: RealEstateValuationRemoved,
};
