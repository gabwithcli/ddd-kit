// apps/finance-api/src/infra/schema/real-estate.ts

import { pgSchema } from "drizzle-orm/pg-core";
import {
  realEstateAppraisalsColumns,
  realEstateMarketValsColumns,
  realEstatesColumns,
} from "./real-estate/real-estate.schema.postgres";

/**
 *
 * In PostgreSQL, there is an entity called a schema (which we believe should be called folders).
 * This creates a structure in PostgreSQL that allows you to group related tables together.
 * @see https://orm.drizzle.team/docs/sql-schema-declaration
 *
 */
export const realEstateFolder = pgSchema("real_estate");

export const realEstateAssets = realEstateFolder.table(
  "real_estate_assets",
  realEstatesColumns
);
export const realEstateAppraisals = realEstateFolder.table(
  "real_estate_proc",
  realEstateAppraisalsColumns
);
