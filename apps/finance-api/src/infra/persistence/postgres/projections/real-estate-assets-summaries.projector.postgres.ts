// ## File: apps/finance-api/src/infra/persistence/postgres/real-estate/real-estate-assets-summaries.projector.postgres.ts

import { IStateProjector, Tx } from "ddd-kit";
import { eq } from "drizzle-orm";
import { RealEstate } from "../../../../domain/real-estate/real-estate.aggregate";
import { Valuation } from "../../../../domain/real-estate/types";
import { asPostgres } from "../uow.postgres";
import { realEstateSummaries } from "./projections.schema.postgres";

/**
 * A state-based projector that rebuilds the `real_estate_summaries` read model
 * from the current state of the RealEstate aggregate.
 */
export class RealEstateStateProjector implements IStateProjector<RealEstate> {
  public async project(aggregate: RealEstate, tx: Tx): Promise<void> {
    const dtx = asPostgres(tx);

    // If the asset is deleted, we should remove it from the summary view.
    if (aggregate.isDeleted) {
      await dtx
        .delete(realEstateSummaries)
        .where(eq(realEstateSummaries.id, aggregate.id));
      return;
    }

    // Helper to find the latest valuation from the aggregate's internal list.
    const findLatestValuation = (valuations: Valuation[]) => {
      if (!valuations || valuations.length === 0) {
        return null;
      }
      // The list is already sorted by date in the aggregate, so we can just take the last one.
      return valuations[valuations.length - 1];
    };

    const latestValuation = findLatestValuation(aggregate.valuations);

    // We perform a single, atomic "upsert" operation.
    // Drizzle's `onConflictDoUpdate` is perfect for this. It will either
    // INSERT a new row or UPDATE an existing one based on the primary key.
    await dtx
      .insert(realEstateSummaries)
      .values({
        id: aggregate.id,
        userId: aggregate.userId,
        name: aggregate.details.name,
        city: aggregate.details.address.props.city,
        country: aggregate.details.address.props.country,
        purchaseDate: aggregate.purchase.date,
        purchaseValue: aggregate.purchase.value.amount,
        baseCurrency: aggregate.details.baseCurrency,
        latestValuationDate: latestValuation?.date ?? null,
        latestValuationValue: latestValuation?.value.amount ?? null,
        updatedAt: new Date(),
      })
      .onConflictDoUpdate({
        target: realEstateSummaries.id, // The column to check for conflicts.
        set: {
          // The fields to update if a conflict occurs.
          name: aggregate.details.name,
          city: aggregate.details.address.props.city,
          country: aggregate.details.address.props.country,
          purchaseDate: aggregate.purchase.date,
          purchaseValue: aggregate.purchase.value.amount,
          baseCurrency: aggregate.details.baseCurrency,
          latestValuationDate: latestValuation?.date ?? null,
          latestValuationValue: latestValuation?.value.amount ?? null,
          updatedAt: new Date(),
        },
      });
  }
}
