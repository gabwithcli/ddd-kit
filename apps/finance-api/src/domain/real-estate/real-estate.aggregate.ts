// ## File: apps/finance-api/src/domain/real-estate/real-estate.aggregate.ts

import { AggregateId, AggregateRoot, invariants } from "ddd-kit/domain";
import { Money } from "../shared/money";
import { RealEstateEvent } from "./real-estate.events";
import type {
  Appraisal,
  PricePoint,
  RealEstateDetails,
  Valuation,
} from "./types";

/**
 * A dedicated type for the aggregate's properties.
 * This makes the constructor and factory methods much more explicit and readable.
 */
type RealEstateProps = {
  userId: string;
  details: RealEstateDetails;
  purchase: PricePoint;
  appraisals: Appraisal[];
  valuations: Valuation[];
  deletedAt: Date | null;
};

export class RealEstate extends AggregateRoot {
  // The aggregate's properties are now stored in a single `props` object.
  private props: RealEstateProps;

  /**
   * The constructor is now private and takes a single props object.
   * This enforces creation through our controlled factory methods (`createAsset`, `fromState`)
   * and improves readability by using named properties.
   *
   * @param {AggregateId<"RealEstate">} id - The unique identifier for the aggregate.
   * @param {RealEstateProps} props - An object containing all the properties for the aggregate's state.
   */
  private constructor(id: AggregateId<"RealEstate">, props: RealEstateProps) {
    super(id);
    this.props = props;
  }

  // --- Factory and Rehydration ---

  static createAsset(args: {
    id: AggregateId<"RealEstate">;
    userId: string;
    details: RealEstateDetails;
    purchase: PricePoint;
    createdAt: Date;
  }) {
    invariants({ aggregate: "RealEstate", operation: "createAsset" })
      .ensure(
        "Purchase currency must match the asset's base currency.",
        "real_estate.currency_mismatch",
        args.purchase.value.currency === args.details.baseCurrency,
        {
          purchaseCurrency: args.purchase.value.currency,
          baseCurrency: args.details.baseCurrency,
        }
      )
      .throwIfAny();

    // We construct the props object explicitly, which is much clearer.
    const props: RealEstateProps = {
      userId: args.userId,
      details: args.details,
      purchase: args.purchase,
      appraisals: [],
      valuations: [],
      deletedAt: null,
    };

    const agg = new RealEstate(args.id, props);

    agg.recordEvent({
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
    // The rehydration method also uses the clear, props-based approach.
    const props: RealEstateProps = {
      userId: s.userId,
      details: s.details,
      purchase: s.purchase,
      appraisals: s.appraisals,
      valuations: s.valuations,
      deletedAt: s.deletedAt ?? null,
    };
    const agg = new RealEstate(s.id, props);
    agg.version = s.version;
    return agg;
  }

  // --- Getters ---
  // Getters now read from the internal `props` object.

  get userId() {
    return this.props.userId;
  }
  get details() {
    return this.props.details;
  }
  get purchase() {
    return this.props.purchase;
  }
  get appraisals(): Appraisal[] {
    return [...this.props.appraisals];
  }
  get valuations(): Valuation[] {
    return [...this.props.valuations];
  }
  get isDeleted(): boolean {
    return this.props.deletedAt !== null;
  }
  get deletedAt(): Date | null {
    return this.props.deletedAt;
  }

  // --- Commands ---
  // Commands now modify the internal `props` object.

  public updateDetails(
    newDetails: Partial<Omit<RealEstateDetails, "baseCurrency">>
  ) {
    this.ensureIsNotDeleted("updateDetails");

    this.props.details = { ...this.props.details, ...newDetails };
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
    const proposedPurchase = { ...this.props.purchase, ...newPurchaseData };
    this.props.purchase = proposedPurchase;

    this.recordEvent({
      type: "RealEstateAssetPurchaseUpdated_V1",
      data: {
        id: this.id,
        purchase: {
          date: this.props.purchase.date,
          value: this.props.purchase.value.props,
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
    this.props.deletedAt = deletedAt;
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
    this.props.appraisals.push(appraisal);
    this.props.appraisals.sort((a, b) => a.date.localeCompare(b.date));
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
      appraisalIndex = this.props.appraisals.findIndex(
        (a) => a.id === appraisalId
      );
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

    const updatedAppraisal = {
      ...this.props.appraisals[appraisalIndex],
      ...data,
    };
    this.runAppraisalInvariants(updatedAppraisal, "updateAppraisal");
    this.props.appraisals[appraisalIndex] = updatedAppraisal;
    this.props.appraisals.sort((a, b) => a.date.localeCompare(b.date));

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
    const initialCount = this.props.appraisals.length;
    this.props.appraisals = this.props.appraisals.filter(
      (a) => a.id !== appraisalId
    );
    invariants({
      aggregate: "RealEstate",
      operation: "removeAppraisal",
      id: this.id,
    })
      .ensure(
        `Appraisal with ID ${appraisalId} not found.`,
        "appraisal.not_found",
        this.props.appraisals.length < initialCount,
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
    this.props.valuations.push(valuation);
    this.props.valuations.sort((a, b) => a.date.localeCompare(b.date));
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
    const valuationIndex = this.props.valuations.findIndex(
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

    const updatedValuation = {
      ...this.props.valuations[valuationIndex],
      ...data,
    };
    this.runValuationInvariants(updatedValuation, "updateValuation");
    this.props.valuations[valuationIndex] = updatedValuation;
    this.props.valuations.sort((a, b) => a.date.localeCompare(b.date));

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
    const initialCount = this.props.valuations.length;
    this.props.valuations = this.props.valuations.filter(
      (v) => v.id !== valuationId
    );
    invariants({
      aggregate: "RealEstate",
      operation: "removeValuation",
      id: this.id,
    })
      .ensure(
        `Valuation with ID ${valuationId} not found.`,
        "valuation.not_found",
        this.props.valuations.length < initialCount,
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

  private recordEvent<T extends RealEstateEvent>(event: T) {
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
        new Date(v.date) >= new Date(this.props.purchase.date)
      )
      .ensure(
        "Appraisal currency must match the asset's base currency.",
        "appraisal.currency_mismatch",
        v.value.currency === this.props.details.baseCurrency
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
        new Date(v.date) >= new Date(this.props.purchase.date)
      )
      .ensure(
        "Valuation currency must match the asset's base currency.",
        "valuation.currency_mismatch",
        v.value.currency === this.props.details.baseCurrency
      )
      .throwIfAny("RealEstate.Invalid");
  }

  private ensureIsNotDeleted(operation: string) {
    invariants({ aggregate: "RealEstate", operation, id: this.id })
      .ensure(
        `Cannot perform '${operation}' on a deleted asset.`,
        "asset.is_deleted",
        !this.isDeleted,
        { deletedAt: this.props.deletedAt }
      )
      .throwIfAny();
  }
}
