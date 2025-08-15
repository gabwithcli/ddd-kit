// apps/finance-api/src/infra/persistence/sqlite/repo.real-estate.sqlite.ts

import { AggregateCrudRepository, Tx } from "@acme/sdk-lite";
import { eq } from "drizzle-orm";
import { RealEstate } from "../../../domain/real-estate/real-estate.aggregate";
import { Address } from "../../../domain/real-estate/types";
import { Money } from "../../../domain/shared/money";
import {
  realEstateAppraisals,
  realEstateMarketVals,
  realEstates,
} from "./real-estate.schema.sqlite";
import { asSqlite } from "./uow.sqlite";

export class RealEstateSqliteRepo
  implements AggregateCrudRepository<RealEstate>
{
  /**
   * Loads a RealEstate aggregate and all its child entities from the database.
   * It rehydrates the full aggregate root from the raw data.
   * @param tx - The database transaction handle.
   * @param id - The ID of the aggregate to load.
   * @returns The rehydrated RealEstate aggregate, or null if not found.
   */
  async load(tx: Tx, id: string): Promise<RealEstate | null> {
    const dtx = asSqlite(tx);

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
}
