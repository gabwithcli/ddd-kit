// ## File: apps/finance-api/src/domain/real-estate/tests/real-estate.valuations.test.ts

import { createAggregateId } from "ddd-kit/domain";
import { ulid } from "ulid";
import { beforeEach, describe, expect, it } from "vitest";
import { Money } from "../../shared/money";
import { RealEstate } from "../real-estate.aggregate";
import { Address } from "../types";

describe("RealEstate Aggregate - Valuations", () => {
  // Helper to set up a consistent, fresh aggregate instance before each test.
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

  // --- COMMAND: addValuation ---
  describe("addValuation", () => {
    let aggregate: RealEstate;

    beforeEach(() => {
      aggregate = createPristineAggregate();
      aggregate.pullEvents();
    });

    it("should add a valuation and emit a valuation added event", () => {
      // ACT
      aggregate.addValuation({
        id: "val_123",
        date: "2024-07-01",
        value: Money.from(600_000, "USD"),
      });

      // ASSERT
      expect(aggregate.valuations).toHaveLength(1);
      expect(aggregate.valuations[0].id).toBe("val_123");
      const events = aggregate.pullEvents();
      expect(events[0].type).toBe("RealEstateValuationAdded_V1");
    });

    it("should throw an error if valuation date is before purchase date", () => {
      // ARRANGE
      const invalidValuation = {
        id: "val_invalid",
        date: "2023-12-31", // Before purchase date
        value: Money.from(490_000, "USD"),
      };

      // ACT & ASSERT
      expect(() => aggregate.addValuation(invalidValuation)).toThrow(
        "Valuation date cannot be before purchase date."
      );
    });
  });

  // --- COMMAND: updateValuation ---
  describe("updateValuation", () => {
    let aggregate: RealEstate;
    const valuationId = "val_existing";

    beforeEach(() => {
      aggregate = createPristineAggregate();
      aggregate.addValuation({
        id: valuationId,
        date: "2024-07-01",
        value: Money.from(600_000, "USD"),
      });
      aggregate.pullEvents();
    });

    it("should update an existing valuation and emit a valuation updated event", () => {
      // ACT
      const updatedValue = Money.from(625_000, "USD");
      aggregate.updateValuation(valuationId, { value: updatedValue });

      // ASSERT
      expect(aggregate.valuations[0].value.equals(updatedValue)).toBe(true);
      const events = aggregate.pullEvents();
      expect(events[0].type).toBe("RealEstateValuationUpdated_V1");
    });

    it("should throw an error when updating a non-existent valuation", () => {
      // ACT & ASSERT
      expect(() =>
        aggregate.updateValuation("val_does_not_exist", {
          value: Money.from(650_000, "USD"),
        })
      ).toThrow("Valuation with ID val_does_not_exist not found.");
    });
  });

  // --- COMMAND: removeValuation ---
  describe("removeValuation", () => {
    let aggregate: RealEstate;
    const valuationId = "val_to_delete";

    beforeEach(() => {
      aggregate = createPristineAggregate();
      aggregate.addValuation({
        id: valuationId,
        date: "2024-07-01",
        value: Money.from(600_000, "USD"),
      });
      aggregate.pullEvents();
    });

    it("should remove a valuation and emit a valuation removed event", () => {
      // ACT
      aggregate.removeValuation(valuationId);

      // ASSERT
      expect(aggregate.valuations).toHaveLength(0);
      const events = aggregate.pullEvents();
      expect(events[0].type).toBe("RealEstateValuationRemoved_V1");
    });

    it("should throw an error when removing a non-existent valuation", () => {
      // ACT & ASSERT
      expect(() => aggregate.removeValuation("val_does_not_exist")).toThrow(
        "Valuation with ID val_does_not_exist not found."
      );
    });
  });
});
