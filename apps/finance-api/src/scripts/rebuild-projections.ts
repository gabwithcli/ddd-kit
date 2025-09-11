// ## File: apps/finance-api/scripts/rebuild-summaries.ts

import { getPersistenceLayer } from "src/infra/persistence";
import { RealEstateKurrentRepo } from "src/infra/persistence/kurrent/real-estate/real-estate.repo.kurrent";
import { RealEstateStateProjector } from "src/infra/persistence/postgres/projections/real-estate-assets-summaries.state-projector.postgres";

/**
 * ============================================================================
 * Read Model Rebuilder Script for Projections, like Real Estate Summaries
 * ============================================================================
 *
 * This script is a dedicated process for building or rebuilding the
 * `real_estate_summaries` read model from scratch. It reads the entire
 * history of the `RealEstate` aggregate from the event store (KurrentDB)
 * and projects the final state of each asset into the query database (Postgres).
 *
 * Why is this needed?
 * - Initial Creation: When the application is first deployed, this script
 * populates the read model.
 * - Schema Changes: If you change the schema of the `real_estate_summaries`
 * table, you can run this script to rebuild it with the new structure.
 * - New Projections: If you create a new projector, this script can be
 * adapted to populate its read model with historical data.
 * - Data Correction: If a bug caused the read model to become inconsistent,
 * this provides a way to restore it to a correct state from the source of truth.
 */

async function main() {
  console.log(
    "🚀 Starting projections rebuild: 'real_estate_summaries' read model..."
  );

  // 1. Initialize our application's persistence layer.
  // This reuses our existing dependency injection setup to get access to
  // the repositories and the unit of work.
  const persistence = getPersistenceLayer();
  const realEstateRepo = persistence.repos.real_estate as RealEstateKurrentRepo;
  const uow = persistence.uow;

  // 2. Instantiate the state-based projector.
  // This is the same projector used by the real-time system. We are reusing it here.
  const projector = new RealEstateStateProjector();

  // 3. Get all aggregate IDs from the event store.
  // We call the new method we added to the repository.
  const aggregateIds = await realEstateRepo.listAllIds();
  console.log(`🔍 Found ${aggregateIds.length} real estate assets to project.`);

  // 4. Loop through each aggregate and project its state.
  let successCount = 0;
  let errorCount = 0;
  for (const id of aggregateIds) {
    try {
      // We process each aggregate in its own small, atomic transaction.
      // This is safer and more resilient than one giant transaction.
      await uow.withTransaction(async (tx) => {
        console.log(`  -> Processing asset ${id}...`);

        // Rehydrate the aggregate to its latest state by replaying its history.
        const aggregate = await realEstateRepo.findById(tx, id);

        if (!aggregate) {
          console.warn(
            `  -! WARNING: Could not find aggregate ${id}, skipping.`
          );
          return;
        }

        // Pass the final state to the projector, which will create or update
        // the record in the Postgres `real_estate_summaries` table.
        await projector.project(aggregate, tx);
      });
      successCount++;
    } catch (error) {
      console.error(`  -X ERROR processing asset ${id}:`, error);
      errorCount++;
    }
  }

  console.log("\n✅ Rebuild complete!");
  console.log(`   - Success: ${successCount}`);
  console.log(`   - Errors:  ${errorCount}`);
}

// Run the script and handle any top-level errors.
main().catch((err) => {
  console.error("\n💥 A fatal error occurred during the rebuild process:", err);
  process.exit(1);
});
