// ## File: apps/finance-api/src/domain/real-estate/events/real-estate-asset-created.event.ts

import { DomainEvent } from "ddd-kit";
import { z } from "zod";
import { RealEstateEventName } from "../real-estate.events";

// We keep the Zod schema for validation, but now it's part of the event class.
export const RealEstateAssetCreatedV1Schema = z.object({
  id: z.string(),
  userId: z.string(),
  details: z.object({
    name: z.string(),
    address: z.object({
      line1: z.string(),
      line2: z.string().optional(),
      postalCode: z.string(),
      city: z.string(),
      state: z.string().optional(),
      country: z.string(),
    }),
    notes: z.string().optional(),
    baseCurrency: z.string(),
  }),
  purchase: z.object({
    date: z.string(),
    value: z.object({
      amount: z.number(),
      currency: z.string(),
    }),
  }),
  at: z.date(),
});

// The data payload type is inferred from the Zod schema.
type EventData = z.infer<typeof RealEstateAssetCreatedV1Schema>;

/**
 * Represents the event that is raised when a new real estate asset is created.
 */
export class RealEstateAssetCreated extends DomainEvent<EventData> {
  // This static property makes the event type string safe and easily accessible.
  public static readonly type: RealEstateEventName =
    "RealEstateAssetCreated_V1";
  public readonly type: RealEstateEventName = RealEstateAssetCreated.type;

  // The constructor takes the raw data, validates it, and passes it to the base class.
  constructor(data: EventData) {
    // We can perform validation right here, ensuring no invalid event can ever be created.
    RealEstateAssetCreatedV1Schema.parse(data);

    // We pass the data up to the DomainEvent base class constructor.
    // The base class will automatically handle the `meta` property.
    super(data, { timestamp: data.at });
  }
}
