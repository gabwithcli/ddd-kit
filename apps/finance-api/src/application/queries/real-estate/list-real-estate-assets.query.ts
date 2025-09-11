import type { Tx } from "ddd-kit";
import { eq } from "drizzle-orm";
import { realEstateSummaries } from "src/infra/persistence/postgres/projections/projections.schema.postgres";
import { asPostgres } from "../../../infra/persistence/postgres/uow.postgres";

export type RealEstateAssetSummary = {
  id: string;
  userId: string;
  name: string;
  purchaseDate: string;
  purchaseValue: number;
  baseCurrency: string;
};

export async function listRealEstateAssetsByUser(
  tx: Tx,
  userId: string
): Promise<RealEstateAssetSummary[]> {
  const dtx = asPostgres(tx);
  return dtx
    .select()
    .from(realEstateSummaries)
    .where(eq(realEstateSummaries.userId, userId));
}
