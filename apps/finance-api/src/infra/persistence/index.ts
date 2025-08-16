// apps/finance-api/src/infra/persistence/index.ts

import { AggregateRepository, UnitOfWork } from "@acme/sdk-lite";

// Import both implementations
import { RealEstate } from "../../domain/real-estate/real-estate.aggregate";
import { RealEstatePostgresRepo } from "./postgres/repo.real-estate.postgres";
import { PostgresUoW } from "./postgres/uow.postgres";
import { RealEstateSqliteRepo } from "./sqlite/real-estate.repo.sqlite";
import { SqliteUoW } from "./sqlite/uow.sqlite";

// Define the shape of the object our factory will return.
export interface PersistenceLayer {
  uow: UnitOfWork;
  repos: {
    real_estate: AggregateRepository<RealEstate>;
    // add other repos here...
  };
}

export function getPersistenceLayer(): PersistenceLayer {
  const client = process.env.DATABASE_CLIENT || "postgres";

  if (client === "sqlite") {
    return {
      uow: SqliteUoW,
      repos: {
        real_estate: new RealEstateSqliteRepo(),
      },
    };
  }

  return {
    uow: PostgresUoW,
    repos: {
      real_estate: new RealEstatePostgresRepo(),
    },
  };
}
