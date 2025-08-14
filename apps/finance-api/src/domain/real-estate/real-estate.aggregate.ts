// finance-api/src/domain/real-estate/aggregate.ts
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
  private constructor(
    id: string,
    public readonly userId: string,
    private _details: RealEstateDetails,
    private _purchase: PricePoint,
    private _appraisals: PricePoint[],
    private _marketVals: PricePoint[]
  ) {
    super(id);
  }

  // Factory
  // -------
  // Enforces intrinsic rules about initial state, then emits RealEstateCreated.
  static create(args: {
    id: string;
    userId: string;
    details: RealEstateDetails;
    purchase: PricePoint;
    now?: () => string; // ISO string producer (override for testing)
  }) {
    const { id, userId, details, purchase } = args;

    // Domain invariants (no I/O), expressed "in English"
    invariants({ aggregate: "RealEstate", operation: "create", id })
      .ensure(
        "Il nome è obbligatorio.",
        "real_estate.name_required",
        details.name?.trim().length > 0,
        { name: details.name }
      )
      .ensure(
        "La valuta dell'acquisto deve coincidere con la baseCurrency.",
        "real_estate.name_required",
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

    const agg = new RealEstate(id, userId, details, purchase, [], []);

    agg.record("RealEstateCreated", {
      id,
      userId,
      at: args.now?.() ?? new Date().toISOString(),
    });

    return agg;
  }

  // Rehydration from persisted state
  static fromState(s: {
    id: string;
    userId: string;
    version: number;
    details: RealEstateDetails;
    purchase: PricePoint;
    appraisals: PricePoint[];
    marketVals: PricePoint[];
  }) {
    const agg = new RealEstate(
      s.id,
      s.userId,
      s.details,
      s.purchase,
      s.appraisals,
      s.marketVals
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

  // Command handlers (mutations)
  // ----------------------------

  addAppraisal(p: PricePoint) {
    // Intrinsic rules for a new appraisal relative to the purchase
    invariants({
      aggregate: "RealEstate",
      operation: "addAppraisal",
      id: this.id,
    })
      .must(
        "real_estate.appraisal_date_valid",
        "La data di perizia deve essere una data valida ISO‑8601.",
        () => !Number.isNaN(Date.parse(p.date)),
        { date: p.date }
      )
      .ensure(
        "real_estate.appraisal_not_before_purchase",
        "La perizia non può essere antecedente alla data di acquisto.",
        new Date(p.date) >= new Date(this._purchase.date),
        { appraisalAt: p.date, purchaseAt: this._purchase.date }
      )
      .ensure(
        "real_estate.appraisal_currency_matches_base",
        "La valuta della perizia deve coincidere con la baseCurrency.",
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
        "real_estate.market_value_date_valid",
        "La data di valutazione deve essere una data valida ISO‑8601.",
        () => !Number.isNaN(Date.parse(p.date)),
        { date: p.date }
      )
      .ensure(
        "real_estate.market_value_not_before_purchase",
        "La valutazione non può essere antecedente alla data di acquisto.",
        new Date(p.date) >= new Date(this._purchase.date),
        { valuationAt: p.date, purchaseAt: this._purchase.date }
      )
      .ensure(
        "real_estate.market_value_currency_matches_base",
        "La valuta della valutazione deve coincidere con la baseCurrency.",
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
        "real_estate.name_required",
        "Il nome è obbligatorio.",
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
