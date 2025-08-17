import { config } from "dotenv";
import { defineConfig } from "drizzle-kit";
import { resolve } from "path";

// Explicitly load the .env.local file from the correct path
config({ path: resolve(__dirname, ".env.local") });

export default defineConfig({
  out: "./drizzle",
  dialect: "postgresql",
  schema: "src/infra/persistence/postgres/schema.postgres.ts",
  dbCredentials: {
    // This will now correctly load the URL
    url: process.env.DATABASE_URL!,
  },
});
