import { AggregateRepository, AllEventUnion, IProjector, Tx } from "ddd-kit";
import { RealEstate } from "../../../../domain/real-estate/real-estate.aggregate";
import { realEstateEventsList } from "../../../../domain/real-estate/real-estate.events";
import { RealEstateStateProjector } from "./real-estate-assets-summaries.state-projector.postgres";

/**
 * An event-driven projector that updates the `real_estate_summaries` read model.
 *
 * It subscribes to all events related to the RealEstate aggregate. Upon receiving an event,
 * it uses the repository to load the LATEST state of the aggregate and then delegates
 * the actual database update to a state-based projector.
 * This ensures the read model is always consistent with the full aggregate state.
 */
export class RealEstateSummaryEventProjector implements IProjector {
  // We subscribe to every event that can possibly change the aggregate's state.
  public readonly subscribesTo = [...realEstateEventsList];

  // We delegate the actual DB logic to the existing state projector for code reuse.
  private readonly stateProjector = new RealEstateStateProjector();

  // It needs the repository to load the full aggregate state.
  constructor(private readonly repo: AggregateRepository<RealEstate>) {}

  /**
   * The main projection logic.
   * @param events - A batch of events for the same aggregate instance.
   * @param tx - The transaction to perform the update within.
   */
  public async project(events: AllEventUnion[], tx: Tx): Promise<void> {
    if (events.length === 0) {
      return;
    }

    // All events in a batch will be for the same aggregate, so we can safely
    // get the ID from the first event.
    const aggregateId = events[0].data.id;
    if (!aggregateId || typeof aggregateId !== "string") {
      console.warn("Projector skipped: Event is missing an aggregate ID.", {
        type: events[0].type,
      });
      return;
    }

    // Here is the key step: we load the aggregate's most current state from the repository.
    // This guarantees we are projecting from the true source of truth, not just event data.
    const aggregate = await this.repo.findById(tx, aggregateId);

    if (!aggregate) {
      // This could happen if an asset is created and deleted in the same transaction.
      // In that case, the state projector will correctly handle the deletion.
      console.warn(
        `Projector: Aggregate ${aggregateId} not found for projection.`
      );
      // We might need a way to handle deletion explicitly if `findById` returns null for deleted items.
      // For now, we'll let the state projector handle a `null` or `deleted` aggregate.
      // A simple way is to pass a "deleted" placeholder to the state projector,
      // which knows to remove the summary.
      const placeholderDeletedAggregate = {
        id: aggregateId,
        isDeleted: true,
      } as RealEstate;
      await this.stateProjector.project(placeholderDeletedAggregate, tx);
      return;
    }

    // Now, we delegate the actual work to our existing state-based projector.
    await this.stateProjector.project(aggregate, tx);
  }
}
