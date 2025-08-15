// apps/finance-api/src/infra/persistence/sqlite/real-estate.schema.sqlite.ts

/* import {
  date,
  integer,
  numeric,
  timestamp,
  varchar,
} from "drizzle-orm/pg-core"; */

// Adjust the schema to fit SQLite data types
/* export const realEstatesColumns = {
  id: varchar("id", { length: 40 }).primaryKey(),
  userId: varchar("user_id", { length: 40 }).notNull(),
  name: varchar("name", { length: 256 }).notNull(),
  addr1: varchar("addr1", { length: 256 }).notNull(),
  addr2: varchar("addr2", { length: 256 }),
  postalCode: varchar("postal_code", { length: 32 }).notNull(),
  city: varchar("city", { length: 128 }).notNull(),
  state: varchar("state", { length: 128 }),
  country: varchar("country", { length: 64 }).notNull(),
  notes: varchar("notes", { length: 2000 }),
  baseCurrency: varchar("base_currency", { length: 3 }).notNull(),
  purchaseDate: date("purchase_date").notNull(),
  purchaseValue: numeric("purchase_value", { precision: 14, scale: 2 })
    .$type<number>()
    .notNull(),
  version: integer("version").notNull().default(0),
  deletedAt: timestamp("deleted_at", { withTimezone: true }),
};

export const realEstateAppraisalsColumns = {
  realEstateId: varchar("real_estate_id", { length: 40 }).notNull(),
  date: date("date").notNull(),
  value: numeric("value", { precision: 14, scale: 2 })
    .$type<number>()
    .notNull(),
};

export const realEstateMarketValsColumns = {
  realEstateId: varchar("real_estate_id", { length: 40 }).notNull(),
  date: date("date").notNull(),
  value: numeric("value", { precision: 14, scale: 2 })
    .$type<number>()
    .notNull(),
}; */

// apps/finance-api/src/infra/schema/real-estate.ts

import { pgTable } from "drizzle-orm/pg-core";
import {
  realEstateAppraisalsColumns,
  realEstateMarketValsColumns,
  realEstatesColumns,
} from "../../schema/real-estate.common";

// The schema now just applies the common definitions to a Sqlite table.
export const realEstates = pgTable("real_estates", realEstatesColumns);

export const realEstateAppraisals = pgTable(
  "real_estate_appraisals",
  realEstateAppraisalsColumns
);

export const realEstateMarketVals = pgTable(
  "real_estate_market_vals",
  realEstateMarketValsColumns
);
