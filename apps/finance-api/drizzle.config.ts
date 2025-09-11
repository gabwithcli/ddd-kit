// apps/finance-api/drizzle.config.ts

import { defineConfig } from "drizzle-kit";
import { env } from "./src/config";

export default defineConfig({
  out: "./drizzle",
  dialect: "postgresql",
  schema: "./src/infra/persistence/postgres/**/*.schema.postgres.ts",
  dbCredentials: {
    url: env.POSTGRES_DB_URL!,
  },
});
