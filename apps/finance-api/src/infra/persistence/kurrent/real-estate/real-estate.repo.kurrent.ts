// ## File: apps/finance-api/src/infra/persistence/kurrent/real-estate.repo.kurrent.ts

import { DomainEvent, Tx } from "ddd-kit";
import { RealEstate } from "src/domain/real-estate/real-estate.aggregate";
import { kurrentClient } from "../db.kurrent";
import { AllRealEstateEvents } from "./real-estate.events.kurrent";

// @ts-expect-error
export class RealEstateKurrentRepo extends AbstractEsRepository<RealEstate> {
  constructor() {
    super();
    // Fail-fast if the KurrentDB client wasn't initialized
    if (!kurrentClient) {
      throw new Error(
        "RealEstateKurrentRepo was instantiated, but the KurrentDB client is not available. Check your environment configuration."
      );
    }
  }

  protected getAggregateClass() {
    return RealEstate;
  }

  // @ts-expect-error
  protected async loadEvents(tx: Tx, id: string): Promise<EventStream> {
    const streamName = `real_estate-${id}`;

    // UPDATED: Switched from the placeholder `getStream` to the fluent API
    // `client.stream(...).read()`, which is a common and expressive pattern.
    // @ts-expect-error
    const streamData = await kurrentClient!.stream(streamName).read();

    if (!streamData) {
      return { events: [], version: 0 };
    }

    const domainEvents = streamData.events.map((storedEvent: any) => {
      const EventClass = AllRealEstateEvents[storedEvent.type];
      if (!EventClass) {
        throw new Error(`Unknown event type in stream: ${storedEvent.type}`);
      }
      return new EventClass(storedEvent.data);
    });

    return {
      events: domainEvents,
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

    // UPDATED: Switched from the placeholder `appendToStream` to the fluent API
    // `client.stream(...).append(...)`. The options object for optimistic
    // concurrency control (`expectedVersion`) remains the same.
    // @ts-expect-error
    await kurrentClient!.stream(streamName).append(eventsToAppend, {
      expectedVersion,
    });
  }
}
