import {
  date,
  integer,
  numeric,
  timestamp,
  varchar,
} from "drizzle-orm/pg-core";

// Schema for the aggregate root table.
export const realEstateAssetsColumns = {
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
  purchaseValue: numeric("purchase_value", {
    precision: 14,
    scale: 2,
  }).notNull(),
  version: integer("version").notNull().default(0),
  deletedAt: timestamp("deleted_at", { withTimezone: true }),
};

// Schema for the appraisals child table.
export const realEstateAppraisalsColumns = {
  id: varchar("id", { length: 40 }).primaryKey(),
  realEstateId: varchar("real_estate_id", { length: 40 }).notNull(),
  date: date("date").notNull(),
  value: numeric("value", { precision: 14, scale: 2 }).notNull(),
};

// Schema for the valuations child table.
export const realEstateValuationsColumns = {
  id: varchar("id", { length: 40 }).primaryKey(),
  realEstateId: varchar("real_estate_id", { length: 40 }).notNull(),
  date: date("date").notNull(),
  value: numeric("value", { precision: 14, scale: 2 }).notNull(),
};
