import { DomainEvent } from "ddd-kit";
import { z } from "zod";
import { RealEstateEventName } from "../real-estate.events";

// 1. Define the Zod schema for the event's data payload.
export const RealEstateAppraisalAddedV1Schema = z.object({
  id: z.string().describe("The aggregate ID"),
  appraisal: z.object({
    id: z.string().describe("The appraisal's own ID"),
    date: z.string(),
    value: z.object({
      amount: z.number(),
      currency: z.string(),
    }),
  }),
});

// 2. Infer the type from the schema.
type EventData = z.infer<typeof RealEstateAppraisalAddedV1Schema>;

// 3. Create the event class.
export class RealEstateAppraisalAdded extends DomainEvent<EventData> {
  public static readonly type: RealEstateEventName =
    "RealEstateAppraisalAdded_V1";
  public readonly type: RealEstateEventName = RealEstateAppraisalAdded.type;

  constructor(data: EventData) {
    // 4. Validate the payload and call the base constructor.
    RealEstateAppraisalAddedV1Schema.parse(data);
    super(data);
  }
}
