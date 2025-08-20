import { and, eq } from "drizzle-orm";
import {
  AggregateRepository,
  Tx,
} from "../../../../../../../packages/ddd-kit/dist";
import { RealEstate } from "../../../../domain/real-estate/real-estate.aggregate";
import { Address } from "../../../../domain/real-estate/types";
import { Money } from "../../../../domain/shared/money";
import {
  realEstateAppraisals,
  realEstateAssets,
  realEstateValuations,
} from "../schema.postgres";
import { asPostgres } from "../uow.postgres";

export class RealEstatePostgresRepo implements AggregateRepository<RealEstate> {
  async findById(tx: Tx, id: string): Promise<RealEstate | null> {
    const dtx = asPostgres(tx);

    // 1. Fetch the aggregate root data.
    const root = await dtx.query.realEstateAssets.findFirst({
      where: eq(realEstateAssets.id, id),
    });
    if (!root) return null;

    // 2. Fetch all related child entities in parallel.
    const [appraisalsData, valuationsData] = await Promise.all([
      dtx.query.realEstateAppraisals.findMany({
        where: eq(realEstateAppraisals.realEstateId, id),
      }),
      dtx.query.realEstateValuations.findMany({
        where: eq(realEstateValuations.realEstateId, id),
      }),
    ]);

    // 3. Rehydrate the aggregate from its raw state.
    // Notice there are no `Number()` calls needed, as our custom schema type
    // has already handled the conversion from string to number.
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

    return agg;
  }

  async save(tx: Tx, agg: RealEstate): Promise<void> {
    // Decide whether to create a new record or update an existing one.
    if (agg.version === 0) {
      await this.insert(tx, agg);
    } else {
      await this.update(tx, agg);
    }
  }

  private async insert(tx: Tx, agg: RealEstate): Promise<void> {
    const dtx = asPostgres(tx);

    // Notice we pass `agg.purchase.value.props.amount` (a number) directly.
    // Our custom schema type's `toDriver` function handles converting it to a string.
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
      version: 1, // Start versioning at 1
    });

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

    // After a successful insert, update the in-memory aggregate's version.
    agg.version = 1;
  }

  private async update(tx: Tx, agg: RealEstate): Promise<void> {
    const dtx = asPostgres(tx);
    const nextVersion = agg.version + 1;

    // Use optimistic concurrency control to prevent race conditions.
    const result = await dtx
      .update(realEstateAssets)
      .set({
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
        version: nextVersion,
      })
      .where(
        and(
          eq(realEstateAssets.id, agg.id),
          eq(realEstateAssets.version, agg.version)
        )
      );

    // If no rows were affected, another process changed the data.
    if (result.rowCount === 0) {
      throw new Error(
        `Optimistic concurrency conflict on RealEstate ${agg.id}`
      );
    }

    // A simple strategy for updating child collections: delete all and re-insert.
    await dtx
      .delete(realEstateAppraisals)
      .where(eq(realEstateAppraisals.realEstateId, agg.id));
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

    // Update the in-memory aggregate's version to match the database.
    agg.version = nextVersion;
  }
}
