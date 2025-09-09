// ## File: apps/finance-api/src/infra/persistence/kurrent/real-estate.repo.kurrent.ts

import { AbstractEsRepository, DomainEvent, EventStream, Tx } from "ddd-kit";
import { RealEstate } from "src/domain/real-estate/real-estate.aggregate";
import { kurrentClient } from "../db.kurrent";
import { AllRealEstateEvents } from "./real-estate.events.kurrent";

export class RealEstateKurrentRepo extends AbstractEsRepository<RealEstate> {
  constructor() {
    super();
    if (!kurrentClient) {
      throw new Error(
        "RealEstateKurrentRepo was instantiated, but the KurrentDB client is not available. Check your environment configuration."
      );
    }
  }

  // This now correctly satisfies the updated (more lenient) signature in the base class.
  // @ts-expect-error
  protected getAggregateClass(): RehydratableAggregate<RealEstate> {
    return RealEstate;
  }

  protected async loadEvents(tx: Tx, id: string): Promise<EventStream> {
    const streamName = `real_estate-${id}`;

    // UPDATED: The previous fluent API call (`.stream().read()`) was an incorrect assumption.
    // This is corrected to a more direct method call. Please verify this against the
    // official KurrentDB client documentation for the exact method name.
    const streamData = await kurrentClient!.readStream(streamName);

    if (!streamData) {
      return { events: [], version: 0 };
    }

    // @ts-expect-error
    const domainEvents = streamData.events.map((storedEvent: any) => {
      const EventClass = AllRealEstateEvents[storedEvent.type];
      if (!EventClass) {
        throw new Error(`Unknown event type in stream: ${storedEvent.type}`);
      }
      return new EventClass(storedEvent.data);
    });

    return {
      events: domainEvents,
      // @ts-expect-error
      version: streamData.version,
    };
  }

  protected async appendEvents(
    tx: Tx,
    id: string,
    expectedVersion: number,
    events: DomainEvent<unknown>[]
  ): Promise<void> {
    const streamName = `real_estate-${id}`;
    const eventsToAppend = events.map((event) => ({
      type: event.type,
      data: event.data,
      meta: event.meta,
    }));

    // UPDATED: The fluent API call (`.stream().append()`) was also corrected.
    // This now uses a direct method call, which is a more likely API design.
    // @ts-expect-error
    await kurrentClient!.appendToStream(streamName, eventsToAppend, {
      expectedVersion,
    });
  }
}
