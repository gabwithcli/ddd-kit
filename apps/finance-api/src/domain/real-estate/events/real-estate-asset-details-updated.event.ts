import { DomainEvent } from "ddd-kit";
import { z } from "zod";
import { RealEstateEventName } from "../real-estate.events";

// 1. Define the Zod schema for the event's data payload.
export const RealEstateAssetDetailsUpdatedV1Schema = z.object({
  id: z.string().describe("The aggregate ID"),
  changes: z.object({
    name: z.string().optional(),
    address: z
      .object({
        line1: z.string(),
        line2: z.string().optional(),
        postalCode: z.string(),
        city: z.string(),
        state: z.string().optional(),
        country: z.string(),
      })
      .optional(),
    notes: z.string().optional(),
  }),
});

// 2. Infer the type from the schema.
type EventData = z.infer<typeof RealEstateAssetDetailsUpdatedV1Schema>;

// 3. Create the event class.
export class RealEstateAssetDetailsUpdated extends DomainEvent<EventData> {
  public static readonly type: RealEstateEventName =
    "RealEstateAssetDetailsUpdated_V1";
  public readonly type: RealEstateEventName =
    RealEstateAssetDetailsUpdated.type;

  constructor(data: EventData) {
    // 4. Validate the payload and call the base constructor.
    RealEstateAssetDetailsUpdatedV1Schema.parse(data);
    super(data);
  }
}
