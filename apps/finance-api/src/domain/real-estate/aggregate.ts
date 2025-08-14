import { AggregateRoot, DomainInvariantError } from "@acme/sdk-lite/domain";
import type { PricePoint, RealEstateDetails } from "./types";
import { Money } from "./types";

/** Helper to build a PricePoint */
export const pp = (
  date: string,
  amount: number,
  currency: string
): PricePoint => ({
  date,
  value: Money.of(amount, currency),
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

  static create(args: {
    id: string;
    userId: string;
    details: RealEstateDetails;
    purchase: PricePoint;
    now?: () => string;
  }) {
    if (!args.details.name?.trim())
      throw new DomainInvariantError("Name is required");
    if (args.purchase.value.props.currency !== args.details.baseCurrency)
      throw new DomainInvariantError(
        "Purchase currency must equal baseCurrency"
      );

    const agg = new RealEstate(
      args.id,
      args.userId,
      args.details,
      args.purchase,
      [],
      []
    );

    agg.record("RealEstateCreated", {
      id: args.id,
      userId: args.userId,
      at: args.now?.() ?? new Date().toISOString(),
    });
    return agg;
  }

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

  addAppraisal(p: PricePoint) {
    this.assertDateAfterPurchase(p);
    this.assertCurrency(p);
    this._appraisals = this.appendSortedByDate(this._appraisals, p);
    this.record("RealEstateAppraised", {
      id: this.id,
      date: p.date,
      value: p.value.props,
    });
  }

  addMarketValuation(p: PricePoint) {
    this.assertDateAfterPurchase(p);
    this.assertCurrency(p);
    this._marketVals = this.appendSortedByDate(this._marketVals, p);
    this.record("RealEstateMarketValued", {
      id: this.id,
      date: p.date,
      value: p.value.props,
    });
  }

  updateDetails(next: Partial<Omit<RealEstateDetails, "baseCurrency">>) {
    if (next.name !== undefined && !next.name.trim())
      throw new DomainInvariantError("Name cannot be empty");
    this._details = { ...this._details, ...next };
    this.record("RealEstateDetailsUpdated", { id: this.id, changed: next });
  }

  private assertDateAfterPurchase(p: PricePoint) {
    if (p.date < this._purchase.date)
      throw new DomainInvariantError("Date must be on/after purchase date");
  }
  private assertCurrency(p: PricePoint) {
    if (p.value.props.currency !== this._details.baseCurrency)
      throw new DomainInvariantError("Currency mismatch with baseCurrency");
  }
  private appendSortedByDate(list: PricePoint[], p: PricePoint) {
    return [...list, p].sort((a, b) => a.date.localeCompare(b.date));
  }
}
