// ## File: apps/finance-api/src/infra/persistence/kurrent/real-estate.repo.kurrent.ts

import {
  AbstractEsRepository,
  EventStream,
  RehydratableAggregate,
  Tx,
} from "ddd-kit";
import { RealEstate } from "src/domain/real-estate/real-estate.aggregate";
import { RealEstateEvents } from "src/domain/real-estate/real-estate.events";
import { ulid } from "ulid";
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

  protected getAggregateClass(): RehydratableAggregate<RealEstate> {
    return RealEstate;
  }

  protected async loadEvents(tx: Tx, id: string): Promise<EventStream> {
    const streamName = `real_estate-${id}`;
    // The KurrentDB client's `readStream` returns an AsyncIterator.
    // We correctly iterate over the stream to collect all events.
    const streamIterator = kurrentClient.readStream(streamName);

    const domainEvents: RealEstateEvents[] = [];
    let streamVersion = 0;

    // Use a `for await...of` loop to consume the async iterator.
    for await (const resolvedEvent of streamIterator) {
      if (!resolvedEvent.event) {
        continue; // Skip empty or unresolved events.
      }

      const storedEvent = resolvedEvent.event;
      const EventClass = AllRealEstateEvents[storedEvent.type];
      if (!EventClass) {
        // It's crucial to handle unknown event types to prevent deserialization errors.
        console.warn(`Unknown event type in stream: ${storedEvent.type}`);
        continue;
      }

      // Re-create the rich DomainEvent class instance from the stored data.
      domainEvents.push(new EventClass(storedEvent.data));
      // Update the stream version with the revision number of the last processed event.
      streamVersion = Number(resolvedEvent.event.revision);
    }

    if (domainEvents.length === 0) {
      // If no events were found, it means the aggregate doesn't exist yet.
      return { events: [], version: 0 };
    }

    return {
      events: domainEvents,
      version: streamVersion,
    };
  }

  protected async appendEvents(
    tx: Tx,
    id: string,
    expectedVersion: number,
    events: RealEstateEvents[]
  ): Promise<void> {
    const streamName = `real_estate-${id}`;

    // Map domain events to the structure KurrentDB expects.
    const eventsToAppend = events.map((event) => {
      return {
        id: ulid(),
        // --- Using a `const` assertion on the contentType. ---
        // This tells TypeScript that the type of this property is not the general `string` type, but the specific literal type `"application/json"`.
        // This makes our object's shape compatible with what the `appendToStream`
        contentType: "application/json" as const,
        type: event.type,
        // The `data` property can be of any type that can be serialized to JSON.
        data: event.data,
        metadata: event.meta,
      };
    });

    if (eventsToAppend.length === 0) {
      return;
    }

    await kurrentClient.appendToStream(streamName, eventsToAppend, {
      streamState: BigInt(expectedVersion),
    });
  }
}
