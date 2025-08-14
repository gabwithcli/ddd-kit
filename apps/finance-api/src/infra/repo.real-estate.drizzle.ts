import type { Tx } from "@acme/sdk-lite/infra";
import { and, eq } from "drizzle-orm";
import { RealEstate } from "../domain/real-estate/real-estate.aggregate";
import { Address } from "../domain/real-estate/types";
import { Money } from "../domain/shared/money";
import {
  realEstateAppraisals,
  realEstateMarketVals,
  realEstates,
} from "./schema";
import { asDrizzle } from "./uow.drizzle"; // helper from above

/** Load the aggregate by id */
export async function loadRealEstate(tx: Tx, id: string) {
  const dtx = asDrizzle(tx); // NodePgDatabase<typeof schema>

  const root = await dtx.query.realEstates.findFirst({
    where: eq(realEstates.id, id),
  });
  if (!root) return { ok: true as const, value: null };

  const [apps, mvals] = await Promise.all([
    dtx.query.realEstateAppraisals.findMany({
      where: eq(realEstateAppraisals.realEstateId, id),
    }),
    dtx.query.realEstateMarketVals.findMany({
      where: eq(realEstateMarketVals.realEstateId, id),
    }),
  ]);

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

  return { ok: true as const, value: agg };
}

/** Persist the aggregate (replace children approach) */
export async function saveRealEstate(tx: Tx, agg: RealEstate) {
  const dtx = asDrizzle(tx);

  // optimistic concurrency via version

  await dtx
    .update(realEstates)
    .set({
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
      purchaseValue: agg.purchase.value.props.amount, // number if you did $type<number>()
      version: agg.version + 1,
    })
    .where(
      and(
        eq(realEstates.id, agg.id),
        eq(realEstates.version, agg.version) // optimistic concurrency
      )
    );

  await dtx
    .delete(realEstateAppraisals)
    .where(eq(realEstateAppraisals.realEstateId, agg.id));
  await dtx.insert(realEstateAppraisals).values(
    agg.appraisals.map((p) => ({
      realEstateId: agg.id,
      date: p.date,
      value: p.value.props.amount,
    }))
  );

  await dtx
    .delete(realEstateMarketVals)
    .where(eq(realEstateMarketVals.realEstateId, agg.id));
  await dtx.insert(realEstateMarketVals).values(
    agg.marketValuations.map((p) => ({
      realEstateId: agg.id,
      date: p.date,
      value: p.value.props.amount,
    }))
  );

  agg.version += 1;
}
