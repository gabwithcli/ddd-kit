import { DomainEvent } from "ddd-kit";
import { z } from "zod";
import { RealEstateEventName } from "../real-estate.events";

// 1. Define the Zod schema for the event's data payload.
export const RealEstateAppraisalRemovedV1Schema = z.object({
  id: z.string().describe("The aggregate ID"),
  appraisalId: z.string().describe("The ID of the removed appraisal"),
});

// 2. Infer the type from the schema.
type EventData = z.infer<typeof RealEstateAppraisalRemovedV1Schema>;

// 3. Create the event class.
export class RealEstateAppraisalRemoved extends DomainEvent<EventData> {
  public static readonly type: RealEstateEventName =
    "RealEstateAppraisalRemoved_V1";
  public readonly type: RealEstateEventName = RealEstateAppraisalRemoved.type;

  constructor(data: EventData) {
    // 4. Validate the payload and call the base constructor.
    RealEstateAppraisalRemovedV1Schema.parse(data);
    super(data);
  }
}
