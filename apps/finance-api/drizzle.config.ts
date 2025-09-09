// apps/finance-api/drizzle.config.ts

import { defineConfig } from "drizzle-kit";

export default defineConfig({
  out: "./drizzle",
  dialect: "postgresql",
  schema: "src/infra/persistence/postgres/schema.postgres.ts",
  dbCredentials: {
    url: process.env.POSTGRES_DB_URL!,
  },
});
