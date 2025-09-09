// packages/ddd-kit/src/memory/console-event-publisher.memory.ts

import type { DomainEvent, EventPublisher } from "../application/command/types";
import type { Tx } from "../infra/unit-of-work";

/**
 * A simple EventPublisher implementation that logs events to the console.
 * This is perfect for development and testing to see what events are being
 * produced by the system without setting up complex infrastructure.
 */
export class ConsoleEventPublisher implements EventPublisher {
  /**
   * "Publishes" events by printing them to the standard output.
   * @param events An array of domain events to publish.
   * @param tx The transaction context. In this simple implementation, it's not used,
   * but it's available for more advanced publishers (e.g., that write
   * to an outbox table within the same transaction).
   */
  public async publish(events: DomainEvent<unknown>[], tx: Tx): Promise<void> {
    if (events.length === 0) {
      return;
    }
    console.log(
      "📣 [ConsoleEventPublisher] Publishing Domain Events to console..."
    );
    // We use JSON.stringify with indentation to make the output readable.
    console.log(JSON.stringify(events, null, 2));
  }
}
