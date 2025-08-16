/**
 * Postgres CRUD Repository for the RealEstate Aggregate (PostgreSQL).
 * This class implements the full contract for loading and saving the aggregate,
 * handling creation, updates, and optimistic concurrency.
 */
import { AggregateRepository, Tx } from "@acme/sdk-lite";
import { and, eq } from "drizzle-orm";
import { RealEstate } from "../../../domain/real-estate/real-estate.aggregate";
import { Address } from "../../../domain/real-estate/types";
import { Money } from "../../../domain/shared/money";
import {
  realEstateAppraisals,
  realEstateMarketVals,
  realEstates,
} from "./real-estate.schema.postgres";
import { asPostgres } from "./uow.postgres";

export class RealEstatePostgresRepo implements AggregateRepository<RealEstate> {
  /**
   * Finds a RealEstate aggregate by its ID and rehydrates it.
   * This method was formerly named `load`. We've renamed it to `findById`
   * to conform to the generic `AggregateRepository` interface.
   * @param tx - The database transaction handle.
   * @param id - The ID of the aggregate to load.
   * @returns The rehydrated RealEstate aggregate, or null if not found.
   */
  async findById(tx: Tx, id: string): Promise<RealEstate | null> {
    const dtx = asPostgres(tx);

    // 1. Fetch the root record from the 'real_estates' table.
    const root = await dtx.query.realEstates.findFirst({
      where: eq(realEstates.id, id),
    });

    if (!root) return null;

    // 2. Fetch all child records (appraisals and market valuations) in parallel.
    const [apps, mvals] = await Promise.all([
      dtx.query.realEstateAppraisals.findMany({
        where: eq(realEstateAppraisals.realEstateId, id),
      }),
      dtx.query.realEstateMarketVals.findMany({
        where: eq(realEstateMarketVals.realEstateId, id),
      }),
    ]);

    // 3. Reconstruct the domain object using the static `fromState` factory.
    // This is the "rehydration" step, turning raw data back into a smart domain model.
    const agg = RealEstate.fromState({
      id,
      userId: root.userId,
      version: root.version,
      deletedAt: root.deletedAt,
      details: {
        name: root.name,
        address: Address.of({
          line1: root.addr1,
          line2: root.addr2 ?? undefined,
          postalCode: root.postalCode,
          city: root.city,
          state: root.state ?? undefined,
          country: root.country,
        }),
        notes: root.notes ?? undefined,
        baseCurrency: root.baseCurrency,
      },
      purchase: {
        date: root.purchaseDate,
        value: Money.from(Number(root.purchaseValue), root.baseCurrency),
      },
      appraisals: apps.map((r) => ({
        date: r.date,
        value: Money.from(Number(r.value), root.baseCurrency),
      })),
      marketVals: mvals.map((r) => ({
        date: r.date,
        value: Money.from(Number(r.value), root.baseCurrency),
      })),
    });

    return agg;
  }

  /**
   * Persists the aggregate. It automatically detects if this is a new aggregate
   * (version 0) or an existing one and calls the appropriate private method.
   */
  async save(tx: Tx, agg: RealEstate): Promise<void> {
    if (agg.version === 0) {
      await this.insert(tx, agg);
    } else {
      await this.update(tx, agg);
    }
  }

  /**
   * Inserts a brand new aggregate (version 0) into the database.
   */
  private async insert(tx: Tx, agg: RealEstate): Promise<void> {
    const dtx = asPostgres(tx);

    // Insert the root record.
    await dtx.insert(realEstates).values({
      id: agg.id,
      userId: agg.userId,
      name: agg.details.name,
      addr1: agg.details.address.props.line1,
      addr2: agg.details.address.props.line2 ?? null,
      postalCode: agg.details.address.props.postalCode,
      city: agg.details.address.props.city,
      state: agg.details.address.props.state ?? null,
      country: agg.details.address.props.country,
      notes: agg.details.notes ?? null,
      baseCurrency: agg.details.baseCurrency,
      purchaseDate: agg.purchase.date,
      purchaseValue: agg.purchase.value.props.amount,
      deletedAt: agg.deletedAt,
      version: 1, // Set initial version to 1.
    });

    // On creation, appraisals and market valuations are always empty,
    // so these inserts will be no-ops, which is correct.
    if (agg.appraisals.length > 0) {
      await dtx.insert(realEstateAppraisals).values(
        agg.appraisals.map((p) => ({
          realEstateId: agg.id,
          date: p.date,
          value: p.value.props.amount,
        }))
      );
    }

    if (agg.marketValuations.length > 0) {
      await dtx.insert(realEstateMarketVals).values(
        agg.marketValuations.map((p) => ({
          realEstateId: agg.id,
          date: p.date,
          value: p.value.props.amount,
        }))
      );
    }

    // Bump the in-memory version to match the newly saved state.
    agg.version = 1;
  }

  /**
   * Updates an existing aggregate and its child collections in the database.
   */
  private async update(tx: Tx, agg: RealEstate): Promise<void> {
    const dtx = asPostgres(tx);
    const nextVersion = agg.version + 1;

    // 1. Update the root record with an optimistic concurrency check.
    // The `where` clause ensures we only update the row if the version matches.
    const result = await dtx
      .update(realEstates)
      .set({
        name: agg.details.name,
        addr1: agg.details.address.props.line1,
        addr2: agg.details.address.props.line2 ?? null,
        postalCode: agg.details.address.props.postalCode,
        city: agg.details.address.props.city,
        state: agg.details.address.props.state ?? null,
        country: agg.details.address.props.country,
        notes: agg.details.notes ?? null,
        deletedAt: agg.deletedAt,
        version: nextVersion,
      })
      .where(
        and(eq(realEstates.id, agg.id), eq(realEstates.version, agg.version))
      );

    // If no rows were affected, another process changed the data. Throw an error.
    if (result.rowCount === 0) {
      throw new Error(
        `Optimistic concurrency conflict. RealEstate ${agg.id} with version ${agg.version} not found.`
      );
    }

    // 2. For child collections, the simplest strategy is to delete and re-insert all of them.
    // This is robust and avoids complex diffing logic.
    await dtx
      .delete(realEstateAppraisals)
      .where(eq(realEstateAppraisals.realEstateId, agg.id));
    if (agg.appraisals.length > 0) {
      await dtx.insert(realEstateAppraisals).values(
        agg.appraisals.map((p) => ({
          realEstateId: agg.id,
          date: p.date,
          value: p.value.props.amount,
        }))
      );
    }

    await dtx
      .delete(realEstateMarketVals)
      .where(eq(realEstateMarketVals.realEstateId, agg.id));
    if (agg.marketValuations.length > 0) {
      await dtx.insert(realEstateMarketVals).values(
        agg.marketValuations.map((p) => ({
          realEstateId: agg.id,
          date: p.date,
          value: p.value.props.amount,
        }))
      );
    }

    // 3. Bump the in-memory version to match the database.
    agg.version = nextVersion;
  }
}
