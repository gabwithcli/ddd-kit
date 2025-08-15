// apps/finance-api/src/infra/persistence/index.ts

import { AggregateCrudRepository, UnitOfWork } from "@acme/sdk-lite";

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
    real_estate: AggregateCrudRepository<RealEstate>;
    // add other repos here...
  };
}

export function getPersistenceLayer(): PersistenceLayer {
  const client = process.env.DATABASE_CLIENT || "postgres";

  // using SQLite for local development !
  if (client === "sqlite") {
    console.log("✅ Using SQLite for persistence.");
    return {
      uow: SqliteUoW,
      repos: {
        real_estate: new RealEstateSqliteRepo(),
      },
    };
  }

  // Default to PostgreSQL
  console.log("✅ Using PostgreSQL for persistence.");
  return {
    uow: PostgresUoW,
    repos: {
      real_estate: new RealEstatePostgresRepo(),
    },
  };
}
