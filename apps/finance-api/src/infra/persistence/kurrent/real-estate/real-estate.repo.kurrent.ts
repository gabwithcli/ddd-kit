// ## File: apps/finance-api/src/infra/persistence/kurrent/real-estate/real-estate.repo.kurrent.ts

import { KurrentDBClient } from "@kurrent/kurrentdb-client";
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
  // We'll hold a reference to the client instance.
  // This is a small improvement for clarity and makes the class easier to test later if needed.
  private readonly client: KurrentDBClient;

  constructor() {
    super();
    if (!kurrentClient) {
      throw new Error(
        "RealEstateKurrentRepo was instantiated, but the KurrentDB client is not available. Check your environment configuration."
      );
    }
    this.client = kurrentClient;
  }

  protected getAggregateClass(): RehydratableAggregate<RealEstate> {
    return RealEstate;
  }

  protected async loadEvents(tx: Tx, id: string): Promise<EventStream> {
    const streamName = `real_estate-${id}`;
    // LOG: Let's log what we're about to do. This is great for debugging reads.
    console.log(
      `[RealEstateKurrentRepo] 🔍 Attempting to load events from stream: ${streamName}`
    );

    try {
      // The KurrentDB client's `readStream` returns an AsyncIterator.
      // We correctly iterate over the stream to collect all events.
      const streamIterator = this.client.readStream(streamName);

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
          console.warn(
            `[RealEstateKurrentRepo] ⚠️ Unknown event type in stream '${streamName}': ${storedEvent.type}`
          );
          continue;
        }

        // Re-create the rich DomainEvent class instance from the stored data.
        domainEvents.push(new EventClass(storedEvent.data));
        // Update the stream version with the revision number of the last processed event.
        streamVersion = Number(resolvedEvent.event.revision);
      }

      // LOG: Success! Let's report what we found.
      console.log(
        `[RealEstateKurrentRepo] ✅ Successfully loaded ${domainEvents.length} events from stream '${streamName}'. Version: ${streamVersion}`
      );

      if (domainEvents.length === 0) {
        // If no events were found, it means the aggregate doesn't exist yet.
        return { events: [], version: 0 };
      }

      return {
        events: domainEvents,
        version: streamVersion,
      };
    } catch (error) {
      // LOG: Something went wrong during the read operation.
      console.error(
        `[RealEstateKurrentRepo] ❌ Error loading events from stream '${streamName}':`,
        error
      );
      // Re-throw the error so the CommandHandler can catch it.
      throw error;
    }
  }

  protected async appendEvents(
    tx: Tx,
    id: string,
    expectedVersion: number,
    events: RealEstateEvents[]
  ): Promise<void> {
    const streamName = `real_estate-${id}`;
    // LOG: This is the critical log for your current issue. Let's see exactly what we're trying to write.
    console.log(
      `[RealEstateKurrentRepo] 📝 Attempting to append ${events.length} event(s) to stream '${streamName}' with expected version ${expectedVersion}`
    );

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

    try {
      // This is the I/O call that's likely failing. We've wrapped it in a try/catch.
      await this.client.appendToStream(streamName, eventsToAppend, {
        streamState: BigInt(expectedVersion),
      });
      // LOG: If we get here, the write to KurrentDB was successful.
      console.log(
        `[RealEstateKurrentRepo] ✅ Successfully appended events to stream '${streamName}'.`
      );
    } catch (error) {
      // LOG: This is the error log we expect to see based on your console output.
      // It will capture the `UnavailableError` and provide the context of the operation.
      console.error(
        `[RealEstateKurrentRepo] ❌ Error appending events to stream '${streamName}':`,
        {
          streamName,
          expectedVersion,
          numberOfEvents: eventsToAppend.length,
          error,
        }
      );
      // Re-throw the original error to ensure the transaction fails and the API returns a 500.
      throw error;
    }
  }
}
