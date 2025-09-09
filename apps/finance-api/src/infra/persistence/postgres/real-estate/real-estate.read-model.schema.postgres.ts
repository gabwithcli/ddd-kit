// This file defines the schema for our denormalized read model table.
// It's optimized for queries, such as listing assets for a user.
import { date, timestamp, varchar } from "drizzle-orm/pg-core";
import { numericAsNumber } from "../custom-types";

export const realEstateSummariesColumns = {
  id: varchar("id", { length: 40 }).primaryKey(),
  userId: varchar("user_id", { length: 40 }).notNull(),
  name: varchar("name", { length: 256 }).notNull(),
  city: varchar("city", { length: 128 }).notNull(),
  country: varchar("country", { length: 64 }).notNull(),
  purchaseDate: date("purchase_date").notNull(),
  purchaseValue: numericAsNumber("purchase_value").notNull(),
  baseCurrency: varchar("base_currency", { length: 3 }).notNull(),
  latestValuationDate: date("latest_valuation_date"),
  latestValuationValue: numericAsNumber("latest_valuation_value"),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
};
