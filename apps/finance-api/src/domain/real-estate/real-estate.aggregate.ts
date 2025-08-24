// apps/finance-api/src/domain/real-estate/real-estate.aggregate.ts

import {
  AggregateId,
  AggregateRoot,
  invariants,
} from "../../../../../packages/ddd-kit/dist/domain"; /// ----> check this
import { Money } from "../shared/money";
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
    id: AggregateId<"RealEstate">,
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
    id: AggregateId<"RealEstate">;
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

    agg.recordEvent({
      // The event type now includes the version suffix.
      type: "RealEstateAssetCreated_V1",
      data: {
        id: args.id,
        userId: args.userId,
        details: {
          name: args.details.name,
          address: args.details.address.props,
          notes: args.details.notes,
          baseCurrency: args.details.baseCurrency,
        },
        purchase: {
          date: args.purchase.date,
          value: args.purchase.value.props,
        },
        at: args.createdAt,
      },
      meta: {
        version: 1,
        timestamp: args.createdAt,
      },
    });

    return agg;
  }

  static fromState(s: {
    id: AggregateId<"RealEstate">;
    userId: string;
    version: number;
    details: RealEstateDetails;
    purchase: PricePoint;
    appraisals: Appraisal[];
    valuations: Valuation[];
    deletedAt?: Date | null;
  }) {
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
  get deletedAt(): Date | null {
    return this._deletedAt;
  }

  // --- Commands ---

  public updateDetails(
    newDetails: Partial<Omit<RealEstateDetails, "baseCurrency">>
  ) {
    this.ensureIsNotDeleted("updateDetails");

    this._details = { ...this._details, ...newDetails };
    this.recordEvent({
      type: "RealEstateAssetDetailsUpdated_V1",
      data: {
        id: this.id,
        changes: {
          ...newDetails,
          address: newDetails.address ? newDetails.address.props : undefined,
        },
      },
      meta: {
        version: 1,
        timestamp: new Date(),
      },
    });
  }

  public updatePurchase(newPurchaseData: Partial<PricePoint>) {
    this.ensureIsNotDeleted("updatePurchase");
    const proposedPurchase = { ...this._purchase, ...newPurchaseData };
    this._purchase = proposedPurchase;

    this.recordEvent({
      type: "RealEstateAssetPurchaseUpdated_V1",
      data: {
        id: this.id,
        purchase: {
          date: this._purchase.date,
          value: this._purchase.value.props,
        },
      },
      meta: {
        version: 1,
        timestamp: new Date(),
      },
    });
  }

  public deleteAsset(deletedAt: Date) {
    if (this.isDeleted) {
      return;
    }
    this._deletedAt = deletedAt;
    this.recordEvent({
      type: "RealEstateAssetDeleted_V1",
      data: { id: this.id, at: deletedAt },
      meta: {
        version: 1,
        timestamp: deletedAt,
      },
    });
  }

  public addAppraisal(appraisal: Appraisal) {
    this.ensureIsNotDeleted("addAppraisal");
    this.runAppraisalInvariants(appraisal, "addAppraisal");
    this._appraisals.push(appraisal);
    this._appraisals.sort((a, b) => a.date.localeCompare(b.date));
    this.recordEvent({
      type: "RealEstateAppraisalAdded_V1",
      data: {
        id: this.id,
        appraisal: {
          id: appraisal.id,
          date: appraisal.date,
          value: appraisal.value.props,
        },
      },
      meta: {
        version: 1,
        timestamp: new Date(),
      },
    });
  }

  public updateAppraisal(
    appraisalId: string,
    data: Partial<{ date: string; value: Money }>
  ) {
    this.ensureIsNotDeleted("updateAppraisal");
    let appraisalIndex = -1;
    const appraisalMustExist = () => {
      appraisalIndex = this._appraisals.findIndex((a) => a.id === appraisalId);
      return appraisalIndex !== -1;
    };
    invariants({
      aggregate: "RealEstate",
      operation: "updateAppraisal",
      id: this.id,
    })
      .must(
        `Appraisal with ID ${appraisalId} not found.`,
        "appraisal.not_found",
        appraisalMustExist,
        { appraisalId }
      )
      .throwIfAny();

    const updatedAppraisal = { ...this._appraisals[appraisalIndex], ...data };
    this.runAppraisalInvariants(updatedAppraisal, "updateAppraisal");
    this._appraisals[appraisalIndex] = updatedAppraisal;
    this._appraisals.sort((a, b) => a.date.localeCompare(b.date));

    this.recordEvent({
      type: "RealEstateAppraisalUpdated_V1",
      data: {
        id: this.id,
        appraisal: {
          id: updatedAppraisal.id,
          date: updatedAppraisal.date,
          value: updatedAppraisal.value.props,
        },
      },
      meta: {
        version: 1,
        timestamp: new Date(),
      },
    });
  }

  public removeAppraisal(appraisalId: string) {
    this.ensureIsNotDeleted("removeAppraisal");
    const initialCount = this._appraisals.length;
    this._appraisals = this._appraisals.filter((a) => a.id !== appraisalId);
    invariants({
      aggregate: "RealEstate",
      operation: "removeAppraisal",
      id: this.id,
    })
      .ensure(
        `Appraisal with ID ${appraisalId} not found.`,
        "appraisal.not_found",
        this._appraisals.length < initialCount,
        { appraisalId }
      )
      .throwIfAny();

    this.recordEvent({
      type: "RealEstateAppraisalRemoved_V1",
      data: { id: this.id, appraisalId },
      meta: {
        version: 1,
        timestamp: new Date(),
      },
    });
  }

  public addValuation(valuation: Valuation) {
    this.ensureIsNotDeleted("addValuation");
    this.runValuationInvariants(valuation, "addValuation");
    this._valuations.push(valuation);
    this._valuations.sort((a, b) => a.date.localeCompare(b.date));
    this.recordEvent({
      type: "RealEstateValuationAdded_V1",
      data: {
        id: this.id,
        valuation: {
          id: valuation.id,
          date: valuation.date,
          value: valuation.value.props,
        },
      },
      meta: {
        version: 1,
        timestamp: new Date(),
      },
    });
  }

  public updateValuation(
    valuationId: string,
    data: Partial<{ date: string; value: Money }>
  ) {
    this.ensureIsNotDeleted("updateValuation");
    const valuationIndex = this._valuations.findIndex(
      (v) => v.id === valuationId
    );
    invariants({
      aggregate: "RealEstate",
      operation: "updateValuation",
      id: this.id,
    })
      .ensure(
        `Valuation with ID ${valuationId} not found.`,
        "valuation.not_found",
        valuationIndex !== -1,
        { valuationId }
      )
      .throwIfAny();

    const updatedValuation = { ...this._valuations[valuationIndex], ...data };
    this.runValuationInvariants(updatedValuation, "updateValuation");
    this._valuations[valuationIndex] = updatedValuation;
    this._valuations.sort((a, b) => a.date.localeCompare(b.date));

    this.recordEvent({
      type: "RealEstateValuationUpdated_V1",
      data: {
        id: this.id,
        valuation: {
          id: updatedValuation.id,
          date: updatedValuation.date,
          value: updatedValuation.value.props,
        },
      },
      meta: {
        version: 1,
        timestamp: new Date(),
      },
    });
  }

  public removeValuation(valuationId: string) {
    this.ensureIsNotDeleted("removeValuation");
    const initialCount = this._valuations.length;
    this._valuations = this._valuations.filter((v) => v.id !== valuationId);
    invariants({
      aggregate: "RealEstate",
      operation: "removeValuation",
      id: this.id,
    })
      .ensure(
        `Valuation with ID ${valuationId} not found.`,
        "valuation.not_found",
        this._valuations.length < initialCount,
        { valuationId }
      )
      .throwIfAny();

    this.recordEvent({
      type: "RealEstateValuationRemoved_V1",
      data: { id: this.id, valuationId },
      meta: {
        version: 1,
        timestamp: new Date(),
      },
    });
  }

  // --- Private Helpers ---

  /**
   * This method is now fully type-safe. It only accepts a valid event object
   * that conforms to our RealEstateEvent discriminated union.
   */
  private recordEvent<T extends RealEstateEvent>(event: T) {
    // Calls the protected `record` method from the base AggregateRoot class.
    super.record(event);
  }

  private runAppraisalInvariants(
    v: { date: string; value: Money },
    operation: string
  ) {
    invariants({ aggregate: "RealEstate", operation, id: this.id })
      .ensure(
        "Appraisal date cannot be before purchase date.",
        "appraisal.date_before_purchase",
        new Date(v.date) >= new Date(this._purchase.date)
      )
      .ensure(
        "Appraisal currency must match the asset's base currency.",
        "appraisal.currency_mismatch",
        v.value.currency === this._details.baseCurrency
      )
      .throwIfAny("RealEstate.Invalid");
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
    invariants({ aggregate: "RealEstate", operation, id: this.id })
      .ensure(
        `Cannot perform '${operation}' on a deleted asset.`,
        "asset.is_deleted",
        !this.isDeleted,
        { deletedAt: this._deletedAt }
      )
      .throwIfAny();
  }
}
