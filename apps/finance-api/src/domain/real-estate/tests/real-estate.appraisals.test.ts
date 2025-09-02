// ## File: apps/finance-api/src/domain/real-estate/tests/real-estate.appraisals.test.ts

import { createAggregateId } from "ddd-kit/domain";
import { ulid } from "ulid";
import { beforeEach, describe, expect, it } from "vitest";
import { Money } from "../../shared/money";
import { RealEstate } from "../real-estate.aggregate";
import { Address } from "../types";

// We group all appraisal-related tests for the RealEstate aggregate.
describe("RealEstate Aggregate - Appraisals", () => {
  // A helper to set up a consistent, fresh aggregate instance before each test.
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

  // --- COMMAND: addAppraisal ---
  describe("addAppraisal", () => {
    let aggregate: RealEstate;

    beforeEach(() => {
      aggregate = createPristineAggregate();
      aggregate.pullEvents(); // Clear creation event for a clean slate
    });

    it("should add an appraisal and emit an appraisal added event", () => {
      // ACT: Perform the action we want to test.
      aggregate.addAppraisal({
        id: "appr_123",
        date: "2024-06-01",
        value: Money.from(550_000, "USD"),
      });

      // ASSERT: Verify the results.
      expect(aggregate.appraisals).toHaveLength(1);
      expect(aggregate.appraisals[0].id).toBe("appr_123");
      const events = aggregate.pullEvents();
      expect(events).toHaveLength(1);
      expect(events[0].type).toBe("RealEstateAppraisalAdded_V1");
    });

    it("should throw an error if appraisal date is before purchase date", () => {
      // ARRANGE: Set up the invalid data.
      const invalidAppraisal = {
        id: "appr_invalid",
        date: "2023-12-31", // This date is before the purchase date
        value: Money.from(490_000, "USD"),
      };

      // ACT & ASSERT: Expect the action to throw a specific domain error.
      expect(() => aggregate.addAppraisal(invalidAppraisal)).toThrow(
        "Appraisal date cannot be before purchase date."
      );
    });
  });

  // --- COMMAND: updateAppraisal ---
  describe("updateAppraisal", () => {
    let aggregate: RealEstate;
    const appraisalId = "appr_existing";

    beforeEach(() => {
      aggregate = createPristineAggregate();
      // Add an initial appraisal to be updated.
      aggregate.addAppraisal({
        id: appraisalId,
        date: "2024-06-01",
        value: Money.from(550_000, "USD"),
      });
      aggregate.pullEvents(); // Clean events before the test action
    });

    it("should update an existing appraisal and emit an appraisal updated event", () => {
      // ACT
      const updatedValue = Money.from(575_000, "USD");
      aggregate.updateAppraisal(appraisalId, { value: updatedValue });

      // ASSERT
      expect(aggregate.appraisals[0].value.equals(updatedValue)).toBe(true);
      const events = aggregate.pullEvents();
      expect(events[0].type).toBe("RealEstateAppraisalUpdated_V1");
      expect((events[0].data as any).appraisal.value.amount).toBe(575_000);
    });

    it("should throw an error when updating a non-existent appraisal", () => {
      // ACT & ASSERT
      expect(() =>
        aggregate.updateAppraisal("appr_does_not_exist", {
          value: Money.from(600_000, "USD"),
        })
      ).toThrow("Appraisal with ID appr_does_not_exist not found.");
    });
  });

  // --- COMMAND: removeAppraisal ---
  describe("removeAppraisal", () => {
    let aggregate: RealEstate;
    const appraisalId = "appr_to_delete";

    beforeEach(() => {
      aggregate = createPristineAggregate();
      aggregate.addAppraisal({
        id: appraisalId,
        date: "2024-06-01",
        value: Money.from(550_000, "USD"),
      });
      aggregate.pullEvents();
    });

    it("should remove an appraisal and emit an appraisal removed event", () => {
      // ACT
      aggregate.removeAppraisal(appraisalId);

      // ASSERT
      expect(aggregate.appraisals).toHaveLength(0);
      const events = aggregate.pullEvents();
      expect(events[0].type).toBe("RealEstateAppraisalRemoved_V1");
      expect((events[0].data as any).appraisalId).toBe(appraisalId);
    });

    it("should throw an error when removing a non-existent appraisal", () => {
      // ACT & ASSERT
      expect(() => aggregate.removeAppraisal("appr_does_not_exist")).toThrow(
        "Appraisal with ID appr_does_not_exist not found."
      );
    });
  });
});
