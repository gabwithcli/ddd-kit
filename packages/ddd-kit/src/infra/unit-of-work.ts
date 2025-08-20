// packages/ddd-kit/src/infra/unit-of-work.ts

/**
 * Unit of Work (UoW) + Transaction marker
 * ---------------------------------------
 * "Tx" is a **transaction handle** passed to repositories so multiple
 * DB writes can happen atomically (all succeed or all roll back).
 *
 * Important:
 * - We **do not** define Tx's internals here. It's intentionally empty.
 * - The real DB layer (e.g., Drizzle/Prisma/Postgres) decides what a Tx is.
 * - Application/domain code just **passes Tx around** without caring about the DB.
 *
 * Benefits:
 * - You can swap databases/libs with minimal app changes.
 * - Tests can pass a fake Tx object easily.
 */
export interface Tx {} // Placeholder/opaque transaction token

export interface UnitOfWork {
  /**
   * Run "fn" inside a DB transaction and return its result.
   * Implementations should:
   * - start a transaction,
   * - call "fn(tx)",
   * - commit on success or rollback on error.
   */
  withTransaction<T>(fn: (tx: Tx) => Promise<T>): Promise<T>;
}
