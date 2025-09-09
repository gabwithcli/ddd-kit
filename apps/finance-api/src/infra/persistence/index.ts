// apps/finance-api/src/infra/persistence/index.ts

import { AggregateRepository, IdempotencyStore, UnitOfWork } from "ddd-kit";
import { env } from "../../config";
import { RealEstate } from "../../domain/real-estate/real-estate.aggregate";
import { RealEstateKurrentRepo } from "./kurrent/real-estate/real-estate.repo.kurrent";
import { KurrentUoW } from "./kurrent/uow.kurrent";
import { PostgresIdempotencyStore } from "./postgres/idempotency.store.postgres";
import { RealEstatePostgresRepo } from "./postgres/real-estate/real-estate.repo.postgres";
import { PostgresUoW } from "./postgres/uow.postgres";

// Define the shape of the object our factory will return.
// we explicitly define each repository, preserving its specific aggregate type.
export interface PersistenceLayer {
  uow: UnitOfWork;
  idempotencyStore: IdempotencyStore;
  repos: {
    real_estate: AggregateRepository<RealEstate>;
  };
}

export function getPersistenceLayer(): PersistenceLayer {
  const client = env.AGGREGATES_DB_CLIENT;

  if (client === "kurrent") {
    // If configured for KurrentDB, we instantiate the event-sourcing stack.
    return {
      uow: KurrentUoW,
      // NOTE: Idempotency store still uses Postgres. This is a common pattern,
      // keeping transactional state separate from the event store.
      idempotencyStore: new PostgresIdempotencyStore(),
      repos: {
        // @ts-expect-error
        real_estate: new RealEstateKurrentRepo(),
        // add other repositories here...
      },
    };
  }

  // Default to the original PostgreSQL CRUD implementation.
  return {
    uow: PostgresUoW,
    idempotencyStore: new PostgresIdempotencyStore(),
    repos: {
      real_estate: new RealEstatePostgresRepo(),
      // add other repositories here...
    },
  };
}
