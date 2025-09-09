// apps/finance-api/src/infra/persistence/kurrent/uow.kurrent.ts
import type { Tx, UnitOfWork } from "ddd-kit/infra";

/**
 * A Unit of Work for KurrentDB.
 * KurrentDB's append operations are often atomic by design for a given stream.
 * For this implementation, we'll treat the UoW as a pass-through, but in a
 * more complex scenario involving multiple stream writes, you'd need a
 * more sophisticated transaction management strategy.
 */
export const KurrentUoW: UnitOfWork = {
  async withTransaction<T>(fn: (tx: Tx) => Promise<T>): Promise<T> {
    // We simply execute the function, passing a dummy transaction object.
    return fn({} as Tx);
  },
};
