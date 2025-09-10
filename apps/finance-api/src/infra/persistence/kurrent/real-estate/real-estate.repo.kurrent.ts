// ## File: apps/finance-api/src/infra/persistence/kurrent/real-estate/real-estate.repo.kurrent.ts

/**
 * ====================================================================================
 * KurrentDB Event Sourcing Repository for the RealEstate Aggregate
 * ====================================================================================
 *
 * What is this file's purpose?
 * ----------------------------
 * This file acts as a persistence adapter, or a "translator," between our rich,
 * behavior-filled domain model (the `RealEstate` aggregate) and the KurrentDB
 * event store.
 *
 * Unlike a traditional CRUD repository that saves the *current state* of an object
 * to a database row, this Event Sourcing (ES) repository saves a *sequence of events*
 * that represent every change ever made to a `RealEstate` asset.
 *
 * Think of it like this:
 * - A CRUD repository takes a snapshot photo.
 * - An ES repository records a video of the entire history.
 *
 * This class implements the generic `AggregateRepository` interface from our `ddd-kit`,
 * meaning the application layer can use it without ever knowing it's talking to an
 * event store. This makes our architecture flexible and persistence-agnostic.
 */

// Importing helpers from the KurrentDB client library.
// - `jsonEvent` is a factory function that correctly formats our event data for KurrentDB.
// - `START` and `FORWARDS` are constants for reading streams, making the code more readable.
// - `NO_STREAM` is a crucial constant for creating new streams correctly.
import {
  FORWARDS,
  jsonEvent,
  KurrentDBClient,
  NO_STREAM,
  START,
  StreamNotFoundError,
} from "@kurrent/kurrentdb-client";
// We depend on the abstract building blocks from our ddd-kit.
import {
  AbstractEsRepository,
  EventStream,
  RehydratableAggregate,
  Tx,
} from "ddd-kit";
// We import the domain model we're responsible for persisting.
import { RealEstate } from "src/domain/real-estate/real-estate.aggregate";
// The `RealEstateEvents` union type is perfect for providing strong type hints to the client.
import { RealEstateEvents } from "src/domain/real-estate/real-estate.events";
// We need the singleton instance of our database client.
import { kurrentClient } from "../db.kurrent";
// This map is crucial for turning raw event data back into rich class instances.
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

  /**
   * This is part of the "Template Method Pattern" from `AbstractEsRepository`.
   * The base class needs a way to call the static `fromHistory` method on our
   * `RealEstate` aggregate. Since we can't pass a static method directly,
   * we provide the class constructor itself, and the base class will call `.fromHistory` on it.
   */
  protected getAggregateClass(): RehydratableAggregate<RealEstate> {
    return RealEstate;
  }

  /**
   * Loads the full history of events for a single aggregate instance and returns them.
   * This process is called "rehydration" because we're rebuilding the aggregate's
   * current state from its past events, breathing life back into it.
   *
   * @param tx The transaction context (in this case, a placeholder for KurrentDB).
   * @param id The unique ID of the aggregate, which corresponds to the stream name.
   * @returns An `EventStream` object containing the list of historical events and the stream's current version.
   */
  protected async loadEvents(tx: Tx, id: string): Promise<EventStream> {
    // KurrentDB organizes events into "streams." By convention, we name the stream
    // after the aggregate type and its unique ID.
    const streamName = `real_estate-${id}`;
    // LOG: Let's log what we're about to do. This is great for debugging reads.
    console.log(
      `[RealEstateKurrentRepo] 🔍 Attempting to load events from stream: ${streamName}`
    );

    try {
      // We ask the KurrentDB client to read the stream for our aggregate.
      // - The `<RealEstateEvents>` generic provides strong typing for the events we'll receive.
      // - `fromRevision: START` tells it to begin at the very first event.
      // - `direction: FORWARDS` tells it to read in chronological order.
      // We omit `maxCount` because to rehydrate an aggregate, we need its entire history.
      const streamIterator = this.client.readStream<RealEstateEvents>(
        streamName,
        {
          fromRevision: START,
          direction: FORWARDS,
        }
      );

      const domainEvents: RealEstateEvents[] = [];
      let streamVersion = 0;

      // The client returns an async iterator, which we loop through to get each event.
      for await (const resolvedEvent of streamIterator) {
        if (!resolvedEvent.event) {
          continue; // Skip empty or unresolved events.
        }

        const storedEvent = resolvedEvent.event;
        // This is the "deserialization" step. We look up the event's type string
        // (e.g., "RealEstateAssetCreated_V1") in our map to get the actual class constructor.
        const EventClass = AllRealEstateEvents[storedEvent.type];
        if (!EventClass) {
          // It's crucial to handle unknown event types to prevent deserialization errors.
          // This might happen during a deployment if an old server reads an event it doesn't know about yet.
          console.warn(
            `[RealEstateKurrentRepo] ⚠️ Unknown event type in stream '${streamName}': ${storedEvent.type}`
          );
          continue;
        }

        // We use the constructor to turn the raw data from the database back into a
        // rich, behavioral `DomainEvent` class instance.
        domainEvents.push(new EventClass(storedEvent.data));
        // The version of the aggregate is the *count* of events. The database revision
        // is 0-indexed, so we add 1 to get the correct version number.
        streamVersion = Number(resolvedEvent.event.revision) + 1;
      }

      // LOG: Success! Let's report what we found.
      console.log(
        `[RealEstateKurrentRepo] ✅ Successfully loaded ${domainEvents.length} events from stream '${streamName}'. Version: ${streamVersion}`
      );

      // We return the full list of events and the final stream version, which the
      // `AbstractEsRepository` will use to call `RealEstate.fromHistory`.
      return {
        events: domainEvents,
        version: streamVersion,
      };
    } catch (error) {
      // If the client throws a `StreamNotFoundError`, it's not a true error for us.
      // It simply means the aggregate has no history yet, which is a valid state.
      if (error instanceof StreamNotFoundError) {
        console.log(
          `[RealEstateKurrentRepo] ℹ️ Stream '${streamName}' not found. Returning empty event stream.`
        );
        return { events: [], version: 0 };
      }

      // LOG: Something went wrong during the read operation.
      console.error(
        `[RealEstateKurrentRepo] ❌ Error loading events from stream '${streamName}':`,
        error
      );
      // Re-throw the error so the CommandHandler can catch it.
      throw error;
    }
  }

  /**
   * Appends a new batch of uncommitted events to an aggregate's stream.
   * This is the "save" operation in an Event Sourcing world.
   *
   * @param tx The transaction context.
   * @param id The ID of the aggregate.
   * @param expectedVersion The version of the stream we think we're writing to. This is for optimistic concurrency control.
   * @param events The new domain events to be saved.
   */
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

    if (events.length === 0) {
      return;
    }

    // This is the "serialization" step. We map our rich domain event classes into the
    // plain object format that the KurrentDB client expects. The `jsonEvent` helper
    // handles creating a unique ID for each event and setting the correct content type.
    const eventsToAppend = events.map((event) =>
      jsonEvent({
        type: event.type,
        data: event.data,
        metadata: event.meta,
      })
    );

    // This is the key to correct optimistic concurrency. We must be precise
    // about our expectations for the stream's state before we write.
    const streamState =
      // Case 1: Creating a new aggregate. The expected version in our domain is 0.
      // We must tell the database we expect the stream NOT to exist.
      expectedVersion === 0
        ? NO_STREAM
        : // Case 2: Updating an existing aggregate. Our domain version is a 1-indexed
          // count of events. The database's revision is a 0-indexed number of the
          // last event. We subtract 1 to align them.
          BigInt(expectedVersion - 1);

    try {
      // This is the actual write operation to the database.
      await this.client.appendToStream(streamName, eventsToAppend, {
        // We pass our precisely calculated expectation. If the actual stream state
        // doesn't match this, the database will reject the write, preventing corruption.
        streamState,
      });
      // LOG: If we get here, the write to KurrentDB was successful.
      console.log(
        `[RealEstateKurrentRepo] ✅ Successfully appended events to stream '${streamName}'.`
      );
    } catch (error) {
      // LOG: This will capture any error from the client, such as a concurrency conflict
      // or a connection issue, and provide rich context for debugging.
      console.error(
        `[RealEstateKurrentRepo] ❌ Error appending events to stream '${streamName}':`,
        {
          streamName,
          expectedVersion,
          // Add the calculated stream state to the log for better debugging.
          expectedStreamState: streamState.toString(),
          numberOfEvents: eventsToAppend.length,
          error,
        }
      );
      // Re-throw the original error to ensure the transaction fails and the API returns a 500.
      throw error;
    }
  }
}
