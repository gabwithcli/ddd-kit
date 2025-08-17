// apps/finance-api/src/infra/persistence/postgres/real-estate/real-estate.repo.postgres.ts

/**
 * @file Postgres implementation of the repository for the RealEstate Aggregate.
 *
 * In Domain-Driven Design, a Repository's job is to act like a smart, in-memory
 * collection of our domain objects. It completely hides the underlying database
 * technology (in this case, PostgreSQL with Drizzle) from the rest of the application.
 *
 * This class implements the generic `AggregateRepository` interface, which gives us
 * a standard contract for loading (`findById`) and saving (`save`) our aggregates.
 * This ensures our application layer (the command handlers) remains blissfully
 * unaware of whether we're using Postgres, DynamoDB, or something else.
 */

import { AggregateRepository, Tx } from "@acme/sdk-lite";
import { and, eq } from "drizzle-orm";
import { RealEstate } from "../../../../domain/real-estate/real-estate.aggregate";
import { Address } from "../../../../domain/real-estate/types";
import { Money } from "../../../../domain/shared/money";
import {
  realEstateAppraisals,
  realEstateMarketVals,
  realEstates,
} from "../schema.postgres";
import { asPostgres } from "../uow.postgres";

export class RealEstatePostgresRepo implements AggregateRepository<RealEstate> {
  /**
   * Finds a RealEstate aggregate by its ID and brings it back to life from the database.
   *
   * This process is often called "rehydration". We take the raw, flat data from our
   * database tables and use it to reconstruct our rich, intelligent `RealEstate` domain object,
   * complete with its methods and invariants.
   *
   * @param tx - The transaction handle. All database operations *must* use this to
   * ensure they are part of the same atomic Unit of Work.
   * @param id - The unique ID of the aggregate we're looking for.
   * @returns A promise that resolves to the fully rehydrated `RealEstate` aggregate, or `null` if it's not found.
   */
  async findById(tx: Tx, id: string): Promise<RealEstate | null> {
    // The `tx` object is a generic handle from our SDK. We use this helper
    // to cast it to the specific Drizzle transaction type our Drizzle queries expect.
    // This little trick keeps the rest of the app decoupled from Drizzle.
    const dtx = asPostgres(tx);

    // Step 1: Fetch the main record for the aggregate from the `real_estates` table.
    // This is the "root" of our aggregate.
    const root = await dtx.query.realEstates.findFirst({
      where: eq(realEstates.id, id),
    });

    // If the root doesn't exist, we can't build the aggregate. Simple as that.
    if (!root) return null;

    // Step 2: Fetch all the related child records in parallel for efficiency.
    // The aggregate's boundary includes appraisals and market valuations, so we
    // need to load them all to ensure the aggregate is in a consistent state.
    const [apps, mvals] = await Promise.all([
      dtx.query.realEstateAppraisals.findMany({
        where: eq(realEstateAppraisals.realEstateId, id),
      }),
      dtx.query.realEstateMarketVals.findMany({
        where: eq(realEstateMarketVals.realEstateId, id),
      }),
    ]);

    // Step 3: Reconstruct the domain object using our static `fromState` factory.
    // We use a dedicated factory for rehydration instead of the constructor directly.
    // This makes it clear that we are rebuilding an *existing* object from trusted
    // data, not creating a *new* one (which would run creation invariants).
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
      // We also need to rehydrate our Value Objects like `Money` for the child collections.
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
   * Persists the entire aggregate's state to the database.
   *
   * This single `save` method handles both creating a new record and updating an
   * existing one. It inspects the aggregate's `version` to decide which path to take.
   * A version of `0` means the object is new and has never been saved before.
   */
  async save(tx: Tx, agg: RealEstate): Promise<void> {
    if (agg.version === 0) {
      await this.insert(tx, agg);
    } else {
      await this.update(tx, agg);
    }
  }

  /**
   * Handles the insertion of a brand new aggregate (one with version 0) into the database.
   */
  private async insert(tx: Tx, agg: RealEstate): Promise<void> {
    const dtx = asPostgres(tx);

    // We "dehydrate" the aggregate's state, flattening its properties (including
    // those from Value Objects like Address and Money) into the columns of our `real_estates` table.
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
      version: 1, // On its first save, the version in the DB becomes 1.
    });

    // The domain model guarantees that on creation, these child collections are empty.
    // However, if the model were to change, this code is robust enough to handle it.
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

    // CRITICAL: We must update the version of our in-memory aggregate object to match
    // what's now in the database. If we didn't, the *next* save would think it's still
    // a new object and try to insert it again, causing a primary key violation.
    agg.version = 1;
  }

  /**
   * Handles updating an existing aggregate in the database.
   */
  private async update(tx: Tx, agg: RealEstate): Promise<void> {
    const dtx = asPostgres(tx);
    const nextVersion = agg.version + 1;

    // Step 1: Update the root record using Optimistic Concurrency Control.
    // This is a crucial pattern for preventing race conditions. The `WHERE` clause
    // checks that the database `version` is the *same* as the one we originally loaded.
    // If another process updated the record in the meantime, its version would have
    // been incremented, and our `UPDATE` statement will affect zero rows.
    const result = await dtx
      .update(realEstates)
      .set({
        // We only update fields that are allowed to change.
        // Immutable properties like `purchaseDate` or `baseCurrency` are omitted.
        name: agg.details.name,
        addr1: agg.details.address.props.line1,
        addr2: agg.details.address.props.line2 ?? null,
        postalCode: agg.details.address.props.postalCode,
        city: agg.details.address.props.city,
        state: agg.details.address.props.state ?? null,
        country: agg.details.address.props.country,
        notes: agg.details.notes ?? null,
        deletedAt: agg.deletedAt,
        version: nextVersion, // We set the new version number.
      })
      .where(
        and(eq(realEstates.id, agg.id), eq(realEstates.version, agg.version))
      );

    // If no rows were affected by the update, it means the version in the database
    // was different. We must throw an error to prevent a "lost update". The caller
    // can then choose to retry the operation (by re-loading the latest data and
    // re-applying the command).
    if (result.rowCount === 0) {
      throw new Error(
        `Optimistic concurrency conflict. RealEstate ${agg.id} with version ${agg.version} not found.`
      );
    }

    // Step 2: For child collections, the simplest and most robust strategy is to
    // just wipe them all and re-insert the current state from the aggregate.
    // This avoids complex and error-prone logic to figure out what was added,
    // removed, or changed. For very large collections, you might consider a
    // more sophisticated "diffing" strategy, but this approach is perfect for most cases.
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

    // Step 3: Just like in the `insert` method, we must bump the version on our
    // in-memory object to match the new state in the database.
    agg.version = nextVersion;
  }
}
