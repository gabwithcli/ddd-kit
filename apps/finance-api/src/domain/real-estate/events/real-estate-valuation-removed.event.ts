import { DomainEvent } from "ddd-kit";
import { z } from "zod";
import { RealEstateEventName } from "../real-estate.events";

// 1. Define the Zod schema for the event's data payload.
export const RealEstateValuationRemovedV1Schema = z.object({
  id: z.string().describe("The aggregate ID"),
  valuationId: z.string().describe("The ID of the removed valuation"),
});

// 2. Infer the type from the schema.
type EventData = z.infer<typeof RealEstateValuationRemovedV1Schema>;

// 3. Create the event class.
export class RealEstateValuationRemoved extends DomainEvent<EventData> {
  public static readonly type: RealEstateEventName =
    "RealEstateValuationRemoved_V1";
  public readonly type: RealEstateEventName = RealEstateValuationRemoved.type;

  constructor(data: EventData) {
    // 4. Validate the payload and call the base constructor.
    RealEstateValuationRemovedV1Schema.parse(data);
    super(data);
  }
}
