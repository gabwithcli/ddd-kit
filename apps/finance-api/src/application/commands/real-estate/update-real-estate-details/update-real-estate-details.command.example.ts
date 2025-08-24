import { UpdateRealEstateDetailsCommandPayload } from "./update-real-estate-details.command.schema";

export const updateRealEstateDetailsPayloadExample = {
  id: "re_1234567890",
  name: "Updated Real Estate Asset",
  address: {
    line1: "456 Updated Street",
    line2: "Suite 100",
    postalCode: "54321",
    city: "Updated City",
    state: "CA",
    country: "USA",
  },
  notes: "Updated notes about the asset",
} satisfies UpdateRealEstateDetailsCommandPayload;
