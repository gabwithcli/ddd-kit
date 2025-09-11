import { pgSchema } from "drizzle-orm/pg-core";
import {
  realEstateAppraisalsColumns,
  realEstateAssetsColumns,
  realEstateValuationsColumns,
} from "./real-estate.columns.schema.postgres";

/**
 * In PostgreSQL, a "schema" acts like a folder to group related tables.
 * We're defining a 'real_estate' schema to hold all our tables for this domain.
 * @see https://orm.drizzle.team/docs/sql-schema-declaration
 */
export const realEstateFolder = pgSchema("real_estate");

// Here we define the actual table objects that Drizzle will use for queries.
// We pass the column definitions we created in the other file.

// The main table for the RealEstate aggregate root.
export const realEstateAssets = realEstateFolder.table(
  "real_estates",
  realEstateAssetsColumns
);

// The table for the Appraisal child entities.
export const realEstateAppraisals = realEstateFolder.table(
  "real_estate_appraisals",
  realEstateAppraisalsColumns
);

// The table for the formal Valuation child entities.
export const realEstateValuations = realEstateFolder.table(
  "real_estate_valuations",
  realEstateValuationsColumns
);
