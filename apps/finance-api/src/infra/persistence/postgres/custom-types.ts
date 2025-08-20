// ## File: apps/finance-api/src/infra/persistence/postgres/custom-types.ts

import { customType } from "drizzle-orm/pg-core";

/**
 * Creates a custom Drizzle type that maps a PostgreSQL `numeric` column
 * to a JavaScript `number`, automatically handling the string conversion.
 *
 * Why we need this:
 * 1.  **Read Path (`fromDriver`):** The `node-postgres` driver returns `numeric`
 * values as strings to preserve precision. This function safely parses
 * that string back into a `number` for use in our application logic.
 * 2.  **Write Path (`toDriver`):** When we want to insert or update data,
 * Drizzle expects a string for `numeric` columns. This function takes
 * our application's `number` and converts it to a string for the driver.
 *
 * This centralizes the conversion logic, keeping our repositories clean and
 * free from repetitive `.toString()` and `Number()` calls.
 */
export const numericAsNumber = customType<{ data: number; driverData: string }>(
  {
    dataType() {
      // Defines the SQL data type for this custom type.
      return "numeric(14, 2)";
    },
    toDriver(value: number): string {
      // Converts the application-side `number` to a `string` for the database driver.
      return value.toString();
    },
    fromDriver(value: string): number {
      // Converts the database `string` back to a `number` for the application.
      return Number(value);
    },
  }
);
