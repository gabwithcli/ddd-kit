/**
 * Drizzle CRUD Repository for the RealEstate Aggregate.
 * This class implements the full contract for loading and saving the aggregate,
 * handling both creation of new entities and updates to existing ones.
 */
import { AggregateCrudRepository, Tx } from "@acme/sdk-lite";
import { and, eq } from "drizzle-orm";
import { RealEstate } from "../domain/real-estate/real-estate.aggregate";
import { Address } from "../domain/real-estate/types";
import { Money } from "../domain/shared/money";
import {
  realEstateAppraisals,
  realEstateMarketVals,
  realEstates,
} from "./schema";
import { asDrizzle } from "./uow.drizzle";

export class RealEstateDrizzleRepo
  implements AggregateCrudRepository<RealEstate>
{
  /**
   * Loads a RealEstate aggregate and all its child entities from the database.
   * This method rehydrates the full aggregate root.
   * @param tx - The database transaction handle.
   * @param id - The ID of the aggregate to load.
   * @returns The rehydrated RealEstate aggregate, or null if not found.
   */
  async load(tx: Tx, id: string): Promise<RealEstate | null> {
    const dtx = asDrizzle(tx);

    const root = await dtx.query.realEstates.findFirst({
      where: eq(realEstates.id, id),
    });

    if (!root) return null;

    // Load child entities in parallel for efficiency.
    const [apps, mvals] = await Promise.all([
      dtx.query.realEstateAppraisals.findMany({
        where: eq(realEstateAppraisals.realEstateId, id),
      }),
      dtx.query.realEstateMarketVals.findMany({
        where: eq(realEstateMarketVals.realEstateId, id),
      }),
    ]);

    // Rehydrate the aggregate from its raw state using the static factory.
    const agg = RealEstate.fromState({
      id,
      userId: root.userId,
      version: root.version,
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
   * Persists the RealEstate aggregate. It intelligently handles both
   * creating a new record and updating an existing one based on the aggregate's version.
   * @param tx - The database transaction handle.
   * @param agg - The RealEstate aggregate to persist.
   */
  async save(tx: Tx, agg: RealEstate): Promise<void> {
    // A version of 0 indicates a newly created aggregate that needs to be inserted.
    if (agg.version === 0) {
      await this.insert(tx, agg);
    } else {
      await this.update(tx, agg);
    }
  }

  /**
   * Inserts a new RealEstate aggregate into the database.
   * This is called for brand new aggregates (version 0).
   */
  private async insert(tx: Tx, agg: RealEstate): Promise<void> {
    const dtx = asDrizzle(tx);

    // Insert the root aggregate record.
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
      version: 1, // Set initial version to 1 after creation.
    });

    // NOTE: For a create command, appraisals and market valuations will be empty,
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

    // After a successful save, the in-memory aggregate's version is bumped.
    agg.version = 1;
  }

  /**
   * Updates an existing RealEstate aggregate in the database.
   * This uses optimistic concurrency control based on the version number.
   */
  private async update(tx: Tx, agg: RealEstate): Promise<void> {
    const dtx = asDrizzle(tx);
    const nextVersion = agg.version + 1;

    // Update the root aggregate record, checking the version to prevent conflicts.
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
        baseCurrency: agg.details.baseCurrency, // Note: Domain logic prevents this from changing.
        purchaseDate: agg.purchase.date,
        purchaseValue: agg.purchase.value.props.amount,
        version: nextVersion,
      })
      .where(
        and(eq(realEstates.id, agg.id), eq(realEstates.version, agg.version))
      );

    // If no rows were affected, it means the version was stale (optimistic lock failed).
    if (result.rowCount === 0) {
      throw new Error(
        `Optimistic concurrency conflict. RealEstate aggregate ${agg.id} with version ${agg.version} not found.`
      );
    }

    // For child collections, the simplest strategy is to delete and re-insert.
    // This is robust and easy to implement.
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

    // Increment the in-memory version to match the database.
    agg.version = nextVersion;
  }
}
