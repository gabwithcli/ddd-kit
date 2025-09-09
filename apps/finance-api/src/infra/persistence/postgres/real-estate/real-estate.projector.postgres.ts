// @ts-expect-error
import { AllEventUnion, IProjector, Tx } from "ddd-kit";
import { and, eq, gte, isNull, or } from "drizzle-orm";
import { RealEstateAssetCreated } from "../../../../domain/real-estate/events/real-estate-asset-created.event";
import { RealEstateAssetDeleted } from "../../../../domain/real-estate/events/real-estate-asset-deleted.event";
import { RealEstateAssetDetailsUpdated } from "../../../../domain/real-estate/events/real-estate-asset-details-updated.event";
// Import the valuation events
import { RealEstateValuationAdded } from "../../../../domain/real-estate/events/real-estate-valuation-added.event";
import { RealEstateValuationUpdated } from "../../../../domain/real-estate/events/real-estate-valuation-updated.event";
import { realEstateSummaries } from "../schema.postgres";
import { asPostgres } from "../uow.postgres";

/**
 * RealEstateProjector
 * This class is responsible for updating the `real_estate_summaries` read model table
 * in response to domain events from the RealEstate aggregate.
 */
export class RealEstateProjector implements IProjector {
  // We declare which events this projector is interested in.
  // The ProjectionManager will only send us events of these types.
  public readonly subscribesTo = [
    RealEstateAssetCreated.type,
    RealEstateAssetDetailsUpdated.type,
    RealEstateAssetDeleted.type,
    // Add the new valuation events to our subscription list.
    RealEstateValuationAdded.type,
    RealEstateValuationUpdated.type,
    // Note: Handling ValuationRemoved correctly is complex, see comments below.
  ];

  /**
   * Processes a batch of relevant domain events to update the read model.
   * This operation is guaranteed to run within the same transaction as the command
   * that produced the events, ensuring atomicity.
   */
  public async project(events: AllEventUnion[], tx: Tx): Promise<void> {
    const dtx = asPostgres(tx);

    for (const event of events) {
      // We use a switch to handle each event type we subscribe to.
      switch (event.type) {
        case RealEstateAssetCreated.type: {
          const ev = event as RealEstateAssetCreated;
          // When a new asset is created, we insert a new row into our summary table.
          await dtx.insert(realEstateSummaries).values({
            id: ev.data.id,
            userId: ev.data.userId,
            name: ev.data.details.name,
            city: ev.data.details.address.city,
            country: ev.data.details.address.country,
            purchaseDate: ev.data.purchase.date,
            purchaseValue: ev.data.purchase.value.amount,
            baseCurrency: ev.data.details.baseCurrency,
            updatedAt: ev.meta.timestamp,
          });
          break;
        }
        case RealEstateAssetDetailsUpdated.type: {
          const ev = event as RealEstateAssetDetailsUpdated;
          // When details are updated, we update the corresponding row.
          await dtx
            .update(realEstateSummaries)
            .set({
              name: ev.data.changes.name,
              city: ev.data.changes.address?.city,
              country: ev.data.changes.address?.country,
              updatedAt: ev.meta.timestamp,
            })
            .where(eq(realEstateSummaries.id, ev.data.id));
          break;
        }
        case RealEstateAssetDeleted.type: {
          const ev = event as RealEstateAssetDeleted;
          // When an asset is deleted, we remove its entry from the read model.
          await dtx
            .delete(realEstateSummaries)
            .where(eq(realEstateSummaries.id, ev.data.id));
          break;
        }

        // --- Handle Valuation Events ---

        case RealEstateValuationAdded.type:
        case RealEstateValuationUpdated.type: {
          const ev = event as
            | RealEstateValuationAdded
            | RealEstateValuationUpdated;
          const valuationData =
            "valuation" in ev.data
              ? ev.data.valuation
              : (ev.data as any).appraisal; // Handle both event shapes just in case

          // This is an idempotent update. We only update the summary if the incoming
          // valuation is newer than the one we already have stored. This prevents
          // out-of-order event processing from corrupting our read model.
          await dtx
            .update(realEstateSummaries)
            .set({
              latestValuationDate: valuationData.date,
              latestValuationValue: valuationData.value.amount,
              updatedAt: ev.meta.timestamp,
            })
            .where(
              and(
                eq(realEstateSummaries.id, ev.data.id),
                // Only update if the current stored date is null OR the new date is newer/equal.
                or(
                  isNull(realEstateSummaries.latestValuationDate),
                  gte(
                    valuationData.date,
                    realEstateSummaries.latestValuationDate
                  )
                )
              )
            );
          break;
        }
        /**
         * NOTE on DELETES: Handling the removal of a "latest" item is tricky.
         * If the valuation that was just removed *was* the latest one, we would need
         * to find the "new" latest one. This would require querying the write-side
         * `real_estate_valuations` table, which couples our projector to another
         * table and can be slow. For now, we will omit this logic. A common, simpler
         * strategy is to nullify the fields or to trigger a full rebuild for that specific asset.
         */
      }
    }
  }
}
