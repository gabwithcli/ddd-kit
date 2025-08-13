import type { Tx, UnitOfWork } from "../infra/unit-of-work";

/**
 * InMemoryUoW (InMemoryUnitOfWork)
 * -----------
 * Testing adapter for UnitOfWork:
 * - It doesn't start a real DB transaction.
 * - It simply calls the function with a dummy Tx object.
 *
 * Use this in tests to run command handlers without a database.
 * In production, provide a real UoW (e.g., drizzle.transaction wrapper).
 */
export const InMemoryUoW: UnitOfWork = {
  withTransaction: async <T>(fn: (tx: Tx) => Promise<T>) => fn({} as Tx),
};
