// ## File: apps/finance-api/src/domain/real-estate/tests/real-estate.aggregate.test.ts

import { createAggregateId, DomainInvariantError } from "ddd-kit/domain";
import { ulid } from "ulid";
import { beforeEach, describe, expect, it } from "vitest";
import { Money } from "../../shared/money";
import { RealEstate } from "../real-estate.aggregate";
import { Address } from "../types";

// This suite now focuses on the core lifecycle of the RealEstate aggregate.
describe("RealEstate Aggregate - Core Lifecycle", () => {
  const createPristineAggregate = () => {
    return RealEstate.createAsset({
      id: createAggregateId<"RealEstate">(ulid(), "re"),
      userId: "user_123",
      details: {
        name: "Test Property",
        address: Address.from({
          line1: "123 Main St",
          postalCode: "12345",
          city: "Anytown",
          country: "USA",
        }),
        baseCurrency: "USD",
      },
      purchase: {
        date: "2024-01-15",
        value: Money.from(500_000, "USD"),
      },
      createdAt: new Date("2024-01-15T10:00:00Z"),
    });
  };

  // --- COMMAND: createAsset ---
  describe("createAsset", () => {
    it("should create a new asset with correct initial state and emit a created event", () => {
      const id = createAggregateId<"RealEstate">(ulid(), "re");
      const createdAt = new Date();
      const aggregate = RealEstate.createAsset({
        id,
        userId: "user_123",
        details: {
          name: "New Build Condo",
          address: Address.from({
            line1: "456 New Ave",
            city: "Metropolis",
            postalCode: "54321",
            country: "USA",
          }),
          baseCurrency: "USD",
        },
        purchase: {
          date: "2025-01-01",
          value: Money.from(750_000, "USD"),
        },
        createdAt,
      });

      expect(aggregate.id).toBe(id);
      expect(aggregate.details.name).toBe("New Build Condo");
      const events = aggregate.pullEvents();
      expect(events[0].type).toBe("RealEstateAssetCreated_V1");
    });

    it("should throw an error if the purchase currency does not match the base currency", () => {
      expect(() =>
        RealEstate.createAsset({
          id: createAggregateId<"RealEstate">(ulid(), "re"),
          userId: "user_123",
          details: {
            name: "Mismatch Property",
            address: Address.from({
              line1: "789 Error Ln",
              city: "Failville",
              postalCode: "00000",
              country: "USA",
            }),
            baseCurrency: "USD",
          },
          purchase: {
            date: "2025-01-01",
            value: Money.from(750_000, "EUR"),
          },
          createdAt: new Date(),
        })
      ).toThrow(DomainInvariantError);
    });
  });

  // --- COMMAND: updateDetails ---
  describe("updateDetails", () => {
    let aggregate: RealEstate;
    beforeEach(() => {
      aggregate = createPristineAggregate();
      aggregate.pullEvents();
    });

    it("should update the asset's name and emit a details updated event", () => {
      aggregate.updateDetails({ name: "My Updated Home" });
      expect(aggregate.details.name).toBe("My Updated Home");
      const events = aggregate.pullEvents();
      expect(events[0].type).toBe("RealEstateAssetDetailsUpdated_V1");
    });
  });

  // --- COMMAND: deleteAsset ---
  describe("deleteAsset", () => {
    let aggregate: RealEstate;
    beforeEach(() => {
      aggregate = createPristineAggregate();
      aggregate.pullEvents();
    });

    it("should mark the asset as deleted and emit a deleted event", () => {
      const deletionDate = new Date();
      aggregate.deleteAsset(deletionDate);
      expect(aggregate.isDeleted).toBe(true);
      const events = aggregate.pullEvents();
      expect(events[0].type).toBe("RealEstateAssetDeleted_V1");
    });

    it("should throw an error when trying to modify a deleted asset", () => {
      aggregate.deleteAsset(new Date());
      expect(() =>
        aggregate.updateDetails({ name: "This Should Fail" })
      ).toThrow(/Cannot perform 'updateDetails' on a deleted asset/);
    });
  });
});
