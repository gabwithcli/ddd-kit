// apps/finance-api/src/infra/persistence/index.ts

import { AbstractCrudRepository, IdempotencyStore, UnitOfWork } from "ddd-kit";
import { RealEstate } from "../../domain/real-estate/real-estate.aggregate";
import { PostgresIdempotencyStore } from "./postgres/idempotency.store.postgres";
import { RealEstatePostgresRepo } from "./postgres/real-estate/real-estate.repo.postgres";
import { PostgresUoW } from "./postgres/uow.postgres";

// Define the shape of the object our factory will return.
// we explicitly define each repository, preserving its specific aggregate type.
export interface PersistenceLayer {
  uow: UnitOfWork;
  idempotencyStore: IdempotencyStore;
  repos: {
    real_estate: AbstractCrudRepository<RealEstate>;
    // If you add a portfolio aggregate, you would add its repo here:
    // portfolio: AggregateRepository<Portfolio>;
  };
}

export function getPersistenceLayer(): PersistenceLayer {
  const client = process.env.DATABASE_CLIENT || "postgres"; // or "dynamodb"

  return {
    uow: PostgresUoW,
    idempotencyStore: new PostgresIdempotencyStore(),
    repos: {
      real_estate: new RealEstatePostgresRepo(),
      // add other repositories here...
    },
  };
}
