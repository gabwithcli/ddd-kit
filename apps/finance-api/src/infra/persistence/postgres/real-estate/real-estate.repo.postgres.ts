import { and, eq } from "drizzle-orm";
// The AbstractCrudRepository provides the shared `save` logic, so this class
// only needs to worry about the database-specific implementation details.
import { AbstractCrudRepository, createAggregateId, Tx } from "ddd-kit";
// The RealEstate aggregate is our rich domain model.
// This repository's job is to translate this object to and from the database.
import { RealEstate } from "../../../../domain/real-estate/real-estate.aggregate";
// We import domain-specific Value Objects to reconstruct the aggregate.
import { Address } from "../../../../domain/real-estate/types";
import { Money } from "../../../../domain/shared/money";
// These are the Drizzle schema definitions that map directly to our database tables.
import {
  realEstateAppraisals,
  realEstateAssets,
  realEstateValuations,
} from "../schema.postgres";
// A small helper to cast the generic `Tx` type to the Drizzle-specific transaction type.
import { asPostgres } from "../uow.postgres";

/**
 * RealEstatePostgresRepo is the persistence adapter for the RealEstate aggregate.
 *
 * It acts as a bridge between the rich, behavior-filled domain model (`RealEstate`)
 * and the flat, data-centric structure of the PostgreSQL database. Its sole
 * responsibility is mapping back and forth, using the Drizzle ORM to execute SQL queries.
 *
 * By extending `AbstractCrudRepository`, it inherits the transactional `save` method,
 * which correctly delegates to either `insert` or `update` based on the aggregate's version.
 */
export class RealEstatePostgresRepo extends AbstractCrudRepository<RealEstate> {
  /**
   * Loads a single RealEstate aggregate from the database by its ID.
   * This process is often called "rehydration" because we are taking raw data from
   * the database and "breathing life" back into it by constructing our rich domain objects.
   * @param tx The transaction context to ensure read consistency.
   * @param id The unique identifier of the RealEstate asset.
   * @returns A Promise that resolves to the fully rehydrated `RealEstate` aggregate or `null` if not found.
   */
  async findById(tx: Tx, id: string): Promise<RealEstate | null> {
    // Cast the generic transaction object to the Drizzle-specific type to access its query builder.
    const dtx = asPostgres(tx);

    // 1. Fetch the aggregate root data.
    // The "root" is the main entity of the aggregate, `RealEstate` in this case.
    // It's the only object that external code should hold a reference to.
    const root = await dtx.query.realEstateAssets.findFirst({
      where: eq(realEstateAssets.id, id),
    });

    // If the root entity doesn't exist, the aggregate doesn't exist. We can stop here.
    if (!root) return null;

    // 2. Fetch all related child entities in parallel.
    // To improve performance, we use `Promise.all` to fire off the queries for
    // appraisals and valuations simultaneously. They are independent of each other.
    const [appraisalsData, valuationsData] = await Promise.all([
      dtx.query.realEstateAppraisals.findMany({
        where: eq(realEstateAppraisals.realEstateId, id),
      }),
      dtx.query.realEstateValuations.findMany({
        where: eq(realEstateValuations.realEstateId, id),
      }),
    ]);

    // 3. Rehydrate the aggregate from its raw state.
    // This is the most critical step. We take all the flat data we've queried and
    // use the static `fromState` factory method on our aggregate to reconstruct the
    // object, including creating instances of Value Objects like `Address` and `Money`.
    // Notice there are no `Number()` calls needed, as our custom schema type
    // has already handled the conversion from string to number.
    const agg = RealEstate.fromState({
      id: createAggregateId(id),
      userId: root.userId,
      version: root.version,
      deletedAt: root.deletedAt,
      details: {
        name: root.name,
        address: Address.from({
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
        value: Money.from(root.purchaseValue, root.baseCurrency),
      },
      appraisals: appraisalsData.map((r) => ({
        id: r.id,
        date: r.date,
        value: Money.from(r.value, root.baseCurrency),
      })),
      valuations: valuationsData.map((r) => ({
        id: r.id,
        date: r.date,
        value: Money.from(r.value, root.baseCurrency),
      })),
    });

    // Return the fully reconstructed and ready-to-use aggregate.
    return agg;
  }

  /**
   * Persists a new RealEstate aggregate to the database.
   * This method is called by the inherited `save` method when the aggregate's version is 0.
   * @param tx The transaction context.
   * @param agg The new RealEstate aggregate to insert.
   */
  protected async insert(tx: Tx, agg: RealEstate): Promise<void> {
    const dtx = asPostgres(tx);

    // Insert the aggregate root data into the `real_estates` table.
    await dtx.insert(realEstateAssets).values({
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
      version: 1, // A new aggregate starts at version 1 in the database.
    });

    // If there are any appraisals, insert them into their dedicated table.
    if (agg.appraisals.length > 0) {
      await dtx.insert(realEstateAppraisals).values(
        agg.appraisals.map((p) => ({
          id: p.id,
          realEstateId: agg.id, // The foreign key linking back to the root.
          date: p.date,
          value: p.value.props.amount,
        }))
      );
    }

    // If there are any valuations, do the same for them.
    if (agg.valuations.length > 0) {
      await dtx.insert(realEstateValuations).values(
        agg.valuations.map((p) => ({
          id: p.id,
          realEstateId: agg.id, // The foreign key.
          date: p.date,
          value: p.value.props.amount,
        }))
      );
    }

    // IMPORTANT: We must update the version of the in-memory aggregate object
    // to match its new state in the database. This signals that it has been
    // successfully persisted and is no longer "new".
    agg.version = 1;
  }

  /**
   * Updates an existing RealEstate aggregate in the database.
   * This method is called by the inherited `save` method when the aggregate's version is > 0.
   * @param tx The transaction context.
   * @param agg The modified RealEstate aggregate to persist.
   */
  protected async update(tx: Tx, agg: RealEstate): Promise<void> {
    const dtx = asPostgres(tx);
    const nextVersion = agg.version + 1;

    // First, update the root entity in the `real_estates` table.
    const result = await dtx
      .update(realEstateAssets)
      .set({
        // Map all the updatable fields from the aggregate to the table columns.
        name: agg.details.name,
        addr1: agg.details.address.props.line1,
        addr2: agg.details.address.props.line2 ?? null,
        postalCode: agg.details.address.props.postalCode,
        city: agg.details.address.props.city,
        state: agg.details.address.props.state ?? null,
        country: agg.details.address.props.country,
        notes: agg.details.notes ?? null,
        purchaseDate: agg.purchase.date,
        purchaseValue: agg.purchase.value.props.amount,
        deletedAt: agg.deletedAt,
        version: nextVersion, // We set the version to the next sequential number.
      })
      // This `where` clause is the key to OPTIMISTIC CONCURRENCY CONTROL.
      // It ensures that we only update the row if its ID matches AND its current
      // database version is the same as the version we originally loaded into memory.
      .where(
        and(
          eq(realEstateAssets.id, agg.id),
          eq(realEstateAssets.version, agg.version)
        )
      );

    // If `rowCount` is 0, it means our `where` clause didn't find a matching row.
    // This happens if another process updated the record between the time we read it
    // and the time we tried to write it, causing a version mismatch.
    if (result.rowCount === 0) {
      throw new Error(
        `Optimistic concurrency conflict on RealEstate ${agg.id}`
      );
    }

    // For child entities, we use a simple and robust "delete-and-re-insert" strategy.
    // This guarantees that the child tables are an exact reflection of the aggregate's current state.
    // While not the most performant for very large collections, it's very reliable.

    // First, delete all existing appraisals for this asset.
    await dtx
      .delete(realEstateAppraisals)
      .where(eq(realEstateAppraisals.realEstateId, agg.id));
    // Then, if there are any appraisals in our aggregate, insert them all as new.
    if (agg.appraisals.length > 0) {
      await dtx.insert(realEstateAppraisals).values(
        agg.appraisals.map((p) => ({
          id: p.id,
          realEstateId: agg.id,
          date: p.date,
          value: p.value.props.amount,
        }))
      );
    }

    // Repeat the same "delete-and-re-insert" process for valuations.
    await dtx
      .delete(realEstateValuations)
      .where(eq(realEstateValuations.realEstateId, agg.id));
    if (agg.valuations.length > 0) {
      await dtx.insert(realEstateValuations).values(
        agg.valuations.map((p) => ({
          id: p.id,
          realEstateId: agg.id,
          date: p.date,
          value: p.value.props.amount,
        }))
      );
    }

    // Finally, just as with an insert, we must update the in-memory aggregate's version
    // to reflect its new state in the database.
    agg.version = nextVersion;
  }
}
