import { DomainEvent } from "ddd-kit";
import { z } from "zod";
import { RealEstateEventName } from "../real-estate.events";

// 1. Define the Zod schema for the event's data payload.
export const RealEstateAssetPurchaseUpdatedV1Schema = z.object({
  id: z.string().describe("The aggregate ID"),
  purchase: z.object({
    date: z.string(),
    value: z.object({
      amount: z.number(),
      currency: z.string(),
    }),
  }),
});

// 2. Infer the type from the schema.
type EventData = z.infer<typeof RealEstateAssetPurchaseUpdatedV1Schema>;

// 3. Create the event class.
export class RealEstateAssetPurchaseUpdated extends DomainEvent<EventData> {
  public static readonly type: RealEstateEventName =
    "RealEstateAssetPurchaseUpdated_V1";
  public readonly type: RealEstateEventName =
    RealEstateAssetPurchaseUpdated.type;

  constructor(data: EventData) {
    // 4. Validate the payload and call the base constructor.
    RealEstateAssetPurchaseUpdatedV1Schema.parse(data);
    super(data);
  }
}
