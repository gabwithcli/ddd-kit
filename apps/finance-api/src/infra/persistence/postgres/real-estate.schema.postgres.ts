// apps/finance-api/src/infra/schema/real-estate.ts

import { pgTable } from "drizzle-orm/pg-core";
import {
  realEstateAppraisalsColumns,
  realEstateMarketValsColumns,
  realEstatesColumns,
} from "../../schema/real-estate.common";

// The schema now just applies the common definitions to a PostgreSQL table.
export const realEstates = pgTable("real_estates", realEstatesColumns);

export const realEstateAppraisals = pgTable(
  "real_estate_appraisals",
  realEstateAppraisalsColumns
);

export const realEstateMarketVals = pgTable(
  "real_estate_market_vals",
  realEstateMarketValsColumns
);
