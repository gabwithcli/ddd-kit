import { CreateRealEstateAssetCommandPayload } from "./create-real-estate-asset.command.schema";

export const createRealEstateAssetPayloadExample = {
  details: {
    name: "Example Real Estate Asset",
    address: {
      line1: "123 Main Street",
      line2: "Apt 4B",
      postalCode: "12345",
      city: "Anytown",
      state: "NY",
      country: "USA",
    },
    notes: "Example notes about the asset",
    baseCurrency: "USD",
  },
  purchase: {
    date: "2023-10-26",
    value: 250_000,
  },
} satisfies CreateRealEstateAssetCommandPayload;
