// apps/finance-api/src/domain/real-estate/real-estate.aggregate.ts

import {
  AggregateRoot,
  DomainInvariantError,
  invariants,
} from "@acme/sdk-lite/domain";
import { Money } from "../shared/money";
// ## CHANGE ##: We now import our new, type-safe event definition.
import { RealEstateEvent } from "./real-estate.events";
import type {
  Appraisal,
  PricePoint,
  RealEstateDetails,
  Valuation,
} from "./types";

export class RealEstate extends AggregateRoot {
  private _deletedAt: Date | null = null;

  private constructor(
    id: string,
    public readonly userId: string,
    private _details: RealEstateDetails,
    private _purchase: PricePoint,
    private _appraisals: Appraisal[],
    private _valuations: Valuation[],
    deletedAt: Date | null = null
  ) {
    super(id);
    this._deletedAt = deletedAt;
  }

  // --- Factory and Rehydration ---

  static createAsset(args: {
    id: string;
    userId: string;
    details: RealEstateDetails;
    purchase: PricePoint;
    createdAt: Date;
  }) {
    const agg = new RealEstate(
      args.id,
      args.userId,
      args.details,
      args.purchase,
      [],
      [],
      null
    );

    agg.recordEvent("RealEstateAssetCreated", {
      id: args.id,
      userId: args.userId,
      details: args.details,
      purchase: args.purchase,
      at: args.createdAt,
    });

    return agg;
  }

  static fromState(s: {
    id: string;
    userId: string;
    version: number;
    details: RealEstateDetails;
    purchase: PricePoint;
    appraisals: Appraisal[];
    valuations: Valuation[];
    deletedAt?: Date | null;
  }) {
    // ... (constructor call is the same)
    const agg = new RealEstate(
      s.id,
      s.userId,
      s.details,
      s.purchase,
      s.appraisals,
      s.valuations,
      s.deletedAt ?? null
    );
    agg.version = s.version;
    return agg;
  }

  // --- Getters ---

  get details() {
    return this._details;
  }
  get purchase() {
    return this._purchase;
  }
  get appraisals(): Appraisal[] {
    return [...this._appraisals];
  }
  get valuations(): Valuation[] {
    return [...this._valuations];
  }
  get isDeleted(): boolean {
    return this._deletedAt !== null;
  }

  // --- Commands ---

  public updateDetails(
    newDetails: Partial<Omit<RealEstateDetails, "baseCurrency">>
  ) {
    this.ensureIsNotDeleted("updateDetails");

    this._details = { ...this._details, ...newDetails };
    this.recordEvent("RealEstateAssetDetailsUpdated", {
      id: this.id,
      changes: newDetails,
    });
  }

  public updatePurchase(newPurchaseData: Partial<PricePoint>) {
    this.ensureIsNotDeleted("updatePurchase");
    const proposedPurchase = { ...this._purchase, ...newPurchaseData };
    this._purchase = proposedPurchase;

    this.recordEvent("RealEstateAssetPurchaseUpdated", {
      id: this.id,
      purchase: this._purchase,
    });
  }

  public deleteAsset(deletedAt: Date) {
    if (this.isDeleted) {
      return;
    }
    this._deletedAt = deletedAt;
    this.recordEvent("RealEstateAssetDeleted", { id: this.id, at: deletedAt });
  }

  public addAppraisal(appraisal: Appraisal) {
    this.ensureIsNotDeleted("addAppraisal");
    this.runValuationInvariants(appraisal, "addAppraisal");
    this._appraisals.push(appraisal);
    this._appraisals.sort((a, b) => a.date.localeCompare(b.date));
    this.recordEvent("RealEstateAppraisalAdded", { id: this.id, appraisal });
  }

  public updateAppraisal(
    appraisalId: string,
    data: Partial<{ date: string; value: Money }>
  ) {
    this.ensureIsNotDeleted("updateAppraisal");

    const appraisalIndex = this._appraisals.findIndex(
      (a) => a.id === appraisalId
    );
    if (appraisalIndex === -1) {
      throw new DomainInvariantError(
        `Appraisal with ID ${appraisalId} not found.`
      );
    }
    const updatedAppraisal = { ...this._appraisals[appraisalIndex], ...data };
    this.runValuationInvariants(updatedAppraisal, "updateAppraisal");
    this._appraisals[appraisalIndex] = updatedAppraisal;
    this._appraisals.sort((a, b) => a.date.localeCompare(b.date));

    this.recordEvent("RealEstateAppraisalUpdated", {
      id: this.id,
      appraisal: updatedAppraisal,
    });
  }

  public removeAppraisal(appraisalId: string) {
    this.ensureIsNotDeleted("removeAppraisal");

    const initialCount = this._appraisals.length;
    this._appraisals = this._appraisals.filter((a) => a.id !== appraisalId);
    if (this._appraisals.length === initialCount) {
      throw new DomainInvariantError(
        `Appraisal with ID ${appraisalId} not found.`
      );
    }

    this.recordEvent("RealEstateAppraisalRemoved", {
      id: this.id,
      appraisalId,
    });
  }

  public addValuation(valuation: Valuation) {
    this.ensureIsNotDeleted("addValuation");
    this.runValuationInvariants(valuation, "addValuation");
    this._valuations.push(valuation);
    this._valuations.sort((a, b) => a.date.localeCompare(b.date));
    this.recordEvent("RealEstateValuationAdded", { id: this.id, valuation });
  }

  public updateValuation(
    valuationId: string,
    data: Partial<{ date: string; value: Money }>
  ) {
    this.ensureIsNotDeleted("updateValuation");

    const valuationIndex = this._valuations.findIndex(
      (v) => v.id === valuationId
    );
    if (valuationIndex === -1) {
      throw new DomainInvariantError(
        `Valuation with ID ${valuationId} not found.`
      );
    }
    const updatedValuation = { ...this._valuations[valuationIndex], ...data };
    this.runValuationInvariants(updatedValuation, "updateValuation");
    this._valuations[valuationIndex] = updatedValuation;
    this._valuations.sort((a, b) => a.date.localeCompare(b.date));

    this.recordEvent("RealEstateValuationUpdated", {
      id: this.id,
      valuation: updatedValuation,
    });
  }

  public removeValuation(valuationId: string) {
    this.ensureIsNotDeleted("removeValuation");

    const initialCount = this._valuations.length;
    this._valuations = this._valuations.filter((v) => v.id !== valuationId);
    if (this._valuations.length === initialCount) {
      throw new DomainInvariantError(
        `Valuation with ID ${valuationId} not found.`
      );
    }

    this.recordEvent("RealEstateValuationRemoved", {
      id: this.id,
      valuationId,
    });
  }

  // --- Private Helpers ---

  /**
   * ## NEW: A private, type-safe wrapper around the base record method.
   * This ensures we can only use event names defined in RealEstateEvent.
   */
  private recordEvent(type: RealEstateEvent, data: unknown) {
    // Calls the protected `record` method from the base AggregateRoot class.
    super.record(type, data);
  }

  private runValuationInvariants(
    v: { date: string; value: Money },
    operation: string
  ) {
    invariants({ aggregate: "RealEstate", operation, id: this.id })
      .ensure(
        "Valuation date cannot be before purchase date.",
        "valuation.date_before_purchase",
        new Date(v.date) >= new Date(this._purchase.date)
      )
      .ensure(
        "Valuation currency must match the asset's base currency.",
        "valuation.currency_mismatch",
        v.value.currency === this._details.baseCurrency
      )
      .throwIfAny("RealEstate.Invalid");
  }

  private ensureIsNotDeleted(operation: string) {
    if (this.isDeleted) {
      throw new DomainInvariantError(
        `Cannot perform '${operation}' on a deleted asset.`
      );
    }
  }
}
