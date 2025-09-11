// This file defines the schema for our denormalized read model table.
// It's optimized for queries, such as listing assets for a user.
import { pgSchema } from "drizzle-orm/pg-core";
import { realEstateSummariesColumns } from "./projections.columns.schema.postgres";

export const projectionsFolder = pgSchema("projections");

export const realEstateSummaries = projectionsFolder.table(
  "real_estate_summaries",
  realEstateSummariesColumns
);
