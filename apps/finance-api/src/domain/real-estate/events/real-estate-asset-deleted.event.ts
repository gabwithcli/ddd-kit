import { DomainEvent } from "ddd-kit";
import { z } from "zod";
import { RealEstateEventName } from "../real-estate.events";

// 1. Define the Zod schema for the event's data payload.
export const RealEstateAssetDeletedV1Schema = z.object({
  id: z.string().describe("The aggregate ID of the deleted asset"),
  at: z.date().describe("The timestamp when the deletion occurred"),
});

// 2. Infer the type from the schema.
type EventData = z.infer<typeof RealEstateAssetDeletedV1Schema>;

// 3. Create the event class.
export class RealEstateAssetDeleted extends DomainEvent<EventData> {
  public static readonly type: RealEstateEventName =
    "RealEstateAssetDeleted_V1";
  public readonly type: RealEstateEventName = RealEstateAssetDeleted.type;

  constructor(data: EventData) {
    // 4. Validate the payload and call the base constructor.
    RealEstateAssetDeletedV1Schema.parse(data);
    super(data, { timestamp: data.at });
  }
}
