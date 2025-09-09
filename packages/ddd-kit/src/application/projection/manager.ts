// File: packages/ddd-kit/src/application/projection/manager.ts

import type { Tx } from "../../infra";
import type { EventPublisher } from "../command";
import type { AllEventUnion, IProjector, KnownEventTypes } from "./projector";

export class ProjectionManager implements EventPublisher {
  // The map is now correctly typed to work in both contexts.
  private subscriptionMap = new Map<KnownEventTypes, IProjector[]>();

  public register(projector: IProjector): void {
    for (const eventType of projector.subscribesTo) {
      if (!this.subscriptionMap.has(eventType)) {
        this.subscriptionMap.set(eventType, []);
      }
      this.subscriptionMap.get(eventType)!.push(projector);
    }
  }

  /**
   * The `publish` method now uses the conditional `AllEventUnion` type.
   * This resolves the 'never' error inside the library while providing
   * strong types in the application.
   */
  public async publish(events: AllEventUnion[], tx: Tx): Promise<void> {
    if (events.length === 0) return;

    console.log(
      "📣 [ProjectionManager] Projecting Domain Events...",
      events.map((e) => e.type)
    );
    const tasks = new Map<IProjector, AllEventUnion[]>();

    for (const event of events) {
      // The type of `event.type` is now correctly inferred in both contexts.
      const subscribers = this.subscriptionMap.get(
        event.type as KnownEventTypes
      );
      if (subscribers) {
        for (const sub of subscribers) {
          if (!tasks.has(sub)) tasks.set(sub, []);
          tasks.get(sub)!.push(event);
        }
      }
    }

    await Promise.all(
      Array.from(tasks.entries()).map(([projector, relevantEvents]) =>
        projector.project(relevantEvents, tx)
      )
    );
  }
}
