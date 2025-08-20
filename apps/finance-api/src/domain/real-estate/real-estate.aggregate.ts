// apps/finance-api/src/domain/real-estate/real-estate.aggregate.ts
// -----------------------------------------------------------------------------
// RealEstate aggregate with "English-like" invariants.
// - Intrinsic rules (no I/O) are expressed via the invariants DSL and thrown
//   as DomainInvariantError (HTTP 422 at the edge).
// - Events are recorded for each mutation (append-only event buffer).
// -----------------------------------------------------------------------------

import { AggregateRoot, invariants } from "@acme/sdk-lite/domain";
import { Money } from "../shared/money";
import type { PricePoint, RealEstateDetails } from "./types";

/** Helper to build a PricePoint (date + monetary value) */
export const pp = (
  date: string,
  amount: number,
  currency: string
): PricePoint => ({
  date,
  value: Money.from(amount, currency),
});

export class RealEstate extends AggregateRoot {
  // private property to track the deleted state in memory.
  private _deletedAt: Date | null = null;

  private constructor(
    id: string,
    public readonly userId: string,
    private _details: RealEstateDetails,
    private _purchase: PricePoint,
    private _appraisals: PricePoint[],
    private _marketVals: PricePoint[],
    deletedAt: Date | null = null // Add to constructor for rehydration
  ) {
    super(id);
    this._deletedAt = deletedAt; // Initialize the property
  }

  // Factory
  // -------
  // This factory is responsible for creating a new, valid RealEstate aggregate.
  // It enforces all the intrinsic business rules (invariants) for a valid creation.
  //
  // ## Refactoring Note ##
  // We've changed this method's signature to make the Aggregate's dependencies
  // more explicit. It no longer generates its own ID prefix or the creation timestamp.
  // Instead, it receives them as plain data. This reinforces a key DDD principle:
  // The domain model should not be concerned with infrastructure tasks like
  // generating IDs or getting the current time. That responsibility belongs to the
  // application layer (the `ICommand` implementation), which orchestrates the process.
  static createAsset(args: {
    id: string; // The full, unique ID is now passed in.
    userId: string;
    details: RealEstateDetails;
    purchase: PricePoint;
    createdAt: Date;
  }) {
    const { id, userId, details, purchase, createdAt } = args;

    // We run our set of business rules, or "invariants", before we even try
    // to create the object. If any rule is violated, this will throw a
    // `DomainInvariantError`, preventing an invalid object from ever existing.
    invariants({ aggregate: "RealEstate", operation: "create", id })
      .ensure(
        "Il nome è obbligatorio.",
        "real_estate.name_required",
        details.name?.trim().length > 0,
        { name: details.name }
      )
      .ensure(
        "La valuta dell'acquisto deve coincidere con la baseCurrency.",
        "real_estate.purchase_currency_mismatch",
        purchase.value.props.currency === details.baseCurrency,
        {
          purchaseCurrency: purchase.value.props.currency,
          baseCurrency: details.baseCurrency,
        }
      )
      .must(
        "La data di acquisto deve essere una data valida ISO-8601.",
        "real_estate.purchase_date_valid",
        () => !Number.isNaN(Date.parse(purchase.date)),
        { purchaseDate: purchase.date }
      )
      .throwIfAny("RealEstate.Invalid");

    // If all invariants pass, we can safely construct the new aggregate instance.
    const agg = new RealEstate(id, userId, details, purchase, [], []);

    // After creation, we record a domain event. This event captures the fact
    // that a new RealEstate was created. In an Event Sourcing model, this is
    // the source of truth. In a CRUD model, this can be used for an outbox
    // pattern to notify other systems.
    agg.record("RealEstateCreated", {
      id,
      userId,
      at: createdAt, // We use the timestamp that was passed in.
    });

    return agg;
  }

  // Rehydration from persisted state
  // This method remains unchanged. It's used by the repository to reconstruct
  // the aggregate from raw database data.
  static fromState(s: {
    id: string;
    userId: string;
    version: number;
    details: RealEstateDetails;
    purchase: PricePoint;
    appraisals: PricePoint[];
    marketVals: PricePoint[];
    deletedAt?: Date | null; // This field comes from the database
  }) {
    const agg = new RealEstate(
      s.id,
      s.userId,
      s.details,
      s.purchase,
      s.appraisals,
      s.marketVals,
      // It's good practice to also rehydrate soft-delete status
      s.deletedAt ?? null // Pass the deletedAt status to the constructor
    );
    agg.version = s.version;
    return agg;
  }

  // Read-model-ish getters (immutable views on internal state)
  get details() {
    return this._details;
  }
  get purchase() {
    return this._purchase;
  }
  get appraisals() {
    return [...this._appraisals];
  }
  get marketValuations() {
    return [...this._marketVals];
  }
  get deletedAt(): Date | null {
    return this._deletedAt;
  }

  // Command handlers (mutations)
  deleteAsset(deletedAt: Date) {
    // This is our core business rule (invariant) for this operation.
    // An aggregate that is already deleted cannot be deleted again.
    invariants({
      aggregate: "RealEstate",
      operation: "delete",
      id: this.id,
    })
      .ensure(
        "Cannot delete an already deleted asset.",
        "real_estate.already_deleted",
        this._deletedAt === null, // The condition must be true to pass
        { currentDeletedAt: this._deletedAt }
      )
      .throwIfAny("RealEstate.Invalid");

    // If the invariant passes, we mutate the aggregate's state.
    this._deletedAt = deletedAt;

    // And we record a domain event to capture this important business fact.
    this.record("RealEstateDeleted", {
      id: this.id,
      at: deletedAt.toISOString(),
    });
  }

  addAppraisal(p: PricePoint) {
    // Intrinsic rules for a new appraisal relative to the purchase
    invariants({
      aggregate: "RealEstate",
      operation: "addAppraisal",
      id: this.id,
    })
      .must(
        "La data di perizia deve essere una data valida ISO-8601.",
        "real_estate.appraisal_date_valid",
        () => !Number.isNaN(Date.parse(p.date)),
        { date: p.date }
      )
      .ensure(
        "La perizia non può essere antecedente alla data di acquisto.",
        "real_estate.appraisal_not_before_purchase",
        new Date(p.date) >= new Date(this._purchase.date),
        { appraisalAt: p.date, purchaseAt: this._purchase.date }
      )
      .ensure(
        "La valuta della perizia deve coincidere con la baseCurrency.",
        "real_estate.appraisal_currency_matches_base",
        p.value.props.currency === this._details.baseCurrency,
        {
          appraisalCurrency: p.value.props.currency,
          baseCurrency: this._details.baseCurrency,
        }
      )
      .throwIfAny("RealEstate.Invalid");

    this._appraisals = appendSortedByDate(this._appraisals, p);

    this.record("RealEstateAppraised", {
      id: this.id,
      date: p.date,
      value: p.value.props,
    });
  }

  addMarketValuation(p: PricePoint) {
    // Intrinsic rules for a new market valuation relative to the purchase
    invariants({
      aggregate: "RealEstate",
      operation: "addMarketValuation",
      id: this.id,
    })
      .must(
        "La data di valutazione deve essere una data valida ISO-8601.",
        "real_estate.market_value_date_valid",
        () => !Number.isNaN(Date.parse(p.date)),
        { date: p.date }
      )
      .ensure(
        "La valutazione non può essere antecedente alla data di acquisto.",
        "real_estate.market_value_not_before_purchase",
        new Date(p.date) >= new Date(this._purchase.date),
        { valuationAt: p.date, purchaseAt: this._purchase.date }
      )
      .ensure(
        "La valuta della valutazione deve coincidere con la baseCurrency.",
        "real_estate.market_value_currency_matches_base",
        p.value.props.currency === this._details.baseCurrency,
        {
          valuationCurrency: p.value.props.currency,
          baseCurrency: this._details.baseCurrency,
        }
      )
      .throwIfAny("RealEstate.Invalid");

    this._marketVals = appendSortedByDate(this._marketVals, p);

    this.record("RealEstateMarketValued", {
      id: this.id,
      date: p.date,
      value: p.value.props,
    });
  }

  updateDetails(next: Partial<Omit<RealEstateDetails, "baseCurrency">>) {
    // Only intrinsic checks about new details (no I/O)
    invariants({
      aggregate: "RealEstate",
      operation: "updateDetails",
      id: this.id,
    })
      .ensure(
        "Il nome è obbligatorio.",
        "real_estate.name_required",
        next.name === undefined ? true : next.name.trim().length > 0,
        { name: next.name }
      )
      .throwIfAny("RealEstate.Invalid");

    this._details = { ...this._details, ...next };

    this.record("RealEstateDetailsUpdated", {
      id: this.id,
      changed: next,
    });
  }
}

// ---- helpers ----

/** Insert and return a list sorted by ISO date ascending (stable for equal dates). */
function appendSortedByDate(list: PricePoint[], p: PricePoint) {
  return [...list, p].sort((a, b) => a.date.localeCompare(b.date));
}
