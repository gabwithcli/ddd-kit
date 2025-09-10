// ## File: apps/finance-api/src/infra/persistence/kurrent/db.kurrent.ts

// UPDATED: Use the correct package name provided.
import { KurrentDBClient } from "@kurrent/kurrentdb-client";
import { env } from "../../../config";

// It's good practice to ensure the required environment variables are present
// when the application starts, especially when switching persistence layers.
if (env.AGGREGATES_DB_CLIENT === "kurrent" && !env.KURRENT_DB_URL) {
  throw new Error(
    "DATABASE_CLIENT is set to 'kurrent', but KURRENT_DB_URL is not defined."
  );
}

// Initialize the KurrentDB client using the connection string from our config.
// We make it potentially null and handle that in the repository to allow
// the app to run even if only the Postgres config is set.
export const kurrentClient = KurrentDBClient.connectionString`${env.KURRENT_DB_URL!}`;
