/**
 * Event Sourcing repository port.
 * - Minimal surface so you can adapt to any ES backend (EventStoreDB, Dynamo streams, Postgres, etc).
 */
export type DomainEvent = { type: string; data: unknown; timestamp?: string };

export interface AggregateEsRepository {
  loadStream(
    tx: unknown,
    streamId: string
  ): Promise<{
    events: DomainEvent[];
    revision: number | "no_stream";
  }>;

  appendToStream(
    tx: unknown,
    streamId: string,
    events: DomainEvent[],
    expectedRevision: number | "no_stream"
  ): Promise<void>;
}
