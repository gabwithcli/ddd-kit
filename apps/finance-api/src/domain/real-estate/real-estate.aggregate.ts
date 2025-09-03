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
import { Address } from "./types";

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
  // The aggregate's state is held in a single `props` object.
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

  // --- STATE TRANSITION ---

  /**
   * This new, centralized `apply` method is now the ONLY place where
   * the aggregate's state is allowed to change. It acts as a reducer,
   * mutating state based on the event it receives.
   */
  protected apply(event: RealEstateEvent): void {
    switch (event.type) {
      case "RealEstateAssetCreated_V1":
        // The creation event populates the initial state.
        this.props.userId = event.data.userId;
        this.props.details = {
          name: event.data.details.name,
          address: Address.from(event.data.details.address),
          notes: event.data.details.notes,
          baseCurrency: event.data.details.baseCurrency,
        };
        this.props.purchase = {
          date: event.data.purchase.date,
          value: Money.from(
            event.data.purchase.value.amount,
            event.data.purchase.value.currency
          ),
        };
        this.props.appraisals = [];
        this.props.valuations = [];
        this.props.deletedAt = null;
        break;

      case "RealEstateAssetDetailsUpdated_V1":
        // All the state mutation logic from the old `updateDetails` method now lives here.
        this.props.details = {
          ...this.props.details,
          ...event.data.changes,
          address: event.data.changes.address
            ? Address.from(event.data.changes.address)
            : this.props.details.address,
        };
        break;

      case "RealEstateAssetPurchaseUpdated_V1":
        this.props.purchase = {
          date: event.data.purchase.date,
          value: Money.from(
            event.data.purchase.value.amount,
            event.data.purchase.value.currency
          ),
        };
        break;

      case "RealEstateAssetDeleted_V1":
        this.props.deletedAt = event.data.at;
        break;

      case "RealEstateAppraisalAdded_V1":
        this.props.appraisals.push({
          id: event.data.appraisal.id,
          date: event.data.appraisal.date,
          value: Money.from(
            event.data.appraisal.value.amount,
            event.data.appraisal.value.currency
          ),
        });
        this.props.appraisals.sort((a, b) => a.date.localeCompare(b.date));
        break;

      case "RealEstateAppraisalUpdated_V1":
        const appraisalIndex = this.props.appraisals.findIndex(
          (a) => a.id === event.data.appraisal.id
        );
        if (appraisalIndex !== -1) {
          this.props.appraisals[appraisalIndex] = {
            ...this.props.appraisals[appraisalIndex],
            date: event.data.appraisal.date,
            value: Money.from(
              event.data.appraisal.value.amount,
              event.data.appraisal.value.currency
            ),
          };
          this.props.appraisals.sort((a, b) => a.date.localeCompare(b.date));
        }
        break;

      case "RealEstateAppraisalRemoved_V1":
        this.props.appraisals = this.props.appraisals.filter(
          (a) => a.id !== event.data.appraisalId
        );
        break;

      case "RealEstateValuationAdded_V1":
        this.props.valuations.push({
          id: event.data.valuation.id,
          date: event.data.valuation.date,
          value: Money.from(
            event.data.valuation.value.amount,
            event.data.valuation.value.currency
          ),
        });
        this.props.valuations.sort((a, b) => a.date.localeCompare(b.date));
        break;

      case "RealEstateValuationUpdated_V1":
        const valuationIndex = this.props.valuations.findIndex(
          (v) => v.id === event.data.valuation.id
        );
        if (valuationIndex !== -1) {
          this.props.valuations[valuationIndex] = {
            ...this.props.valuations[valuationIndex],
            date: event.data.valuation.date,
            value: Money.from(
              event.data.valuation.value.amount,
              event.data.valuation.value.currency
            ),
          };
          this.props.valuations.sort((a, b) => a.date.localeCompare(b.date));
        }
        break;

      case "RealEstateValuationRemoved_V1":
        this.props.valuations = this.props.valuations.filter(
          (v) => v.id !== event.data.valuationId
        );
        break;
    }
  }

  // --- FACTORIES ---

  static createAsset(args: {
    id: AggregateId<"RealEstate">;
    userId: string;
    details: RealEstateDetails;
    purchase: PricePoint;
    createdAt: Date;
  }) {
    // 1. Invariants are checked upfront.
    invariants({ aggregate: "RealEstate", operation: "createAsset" })
      .ensure(
        "Purchase currency must match the asset's base currency.",
        "real_estate.currency_mismatch",
        args.purchase.value.currency === args.details.baseCurrency
      )
      .throwIfAny();

    // 2. Create a "blank" instance. It only has an ID for now.
    const agg = new RealEstate(args.id, {} as RealEstateProps);

    // 3. Raise the creation event. This will call the `apply` method,
    // which is now responsible for populating the initial state.
    agg.raise({
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
      meta: { version: 1, timestamp: args.createdAt },
    });

    return agg;
  }

  /**
   * The `fromState` factory for CRUD remains unchanged. It's our "snapshot"
   * restoration mechanism and is key to keeping the aggregate persistence-agnostic.
   */
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

  // --- GETTERS ---
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

  // --- COMMANDS ---
  public updateDetails(
    newDetails: Partial<Omit<RealEstateDetails, "baseCurrency">>
  ) {
    this.ensureIsNotDeleted("updateDetails");

    // The command method is now just for validation and raising the event.
    // It no longer mutates state directly.
    this.raise({
      type: "RealEstateAssetDetailsUpdated_V1",
      data: {
        id: this.id,
        changes: {
          ...newDetails,
          address: newDetails.address ? newDetails.address.props : undefined,
        },
      },
      meta: { version: 1, timestamp: new Date() },
    });
  }

  public updatePurchase(newPurchaseData: Partial<PricePoint>) {
    this.ensureIsNotDeleted("updatePurchase");
    const newPurchaseDetails = { ...this.props.purchase, ...newPurchaseData };

    this.raise({
      type: "RealEstateAssetPurchaseUpdated_V1",
      data: {
        id: this.id,
        purchase: {
          date: newPurchaseDetails.date,
          value: newPurchaseDetails.value.props,
        },
      },
      meta: { version: 1, timestamp: new Date() },
    });
  }

  public deleteAsset(deletedAt: Date) {
    if (this.isDeleted) return;
    this.raise({
      type: "RealEstateAssetDeleted_V1",
      data: { id: this.id, at: deletedAt },
      meta: { version: 1, timestamp: deletedAt },
    });
  }

  public addAppraisal(appraisal: Appraisal) {
    this.ensureIsNotDeleted("addAppraisal");
    this.runAppraisalInvariants(appraisal, "addAppraisal");
    this.raise({
      type: "RealEstateAppraisalAdded_V1",
      data: {
        id: this.id,
        appraisal: {
          id: appraisal.id,
          date: appraisal.date,
          value: appraisal.value.props,
        },
      },
      meta: { version: 1, timestamp: new Date() },
    });
  }

  public updateAppraisal(
    appraisalId: string,
    data: Partial<{ date: string; value: Money }>
  ) {
    this.ensureIsNotDeleted("updateAppraisal");
    const appraisalToUpdate = this.props.appraisals.find(
      (a) => a.id === appraisalId
    );
    invariants({
      aggregate: "RealEstate",
      id: this.id,
      operation: "updateAppraisal",
    })
      .ensure(
        `Appraisal with ID ${appraisalId} not found.`,
        "appraisal.not_found",
        !!appraisalToUpdate
      )
      .throwIfAny();

    const updatedAppraisal = { ...appraisalToUpdate!, ...data };
    this.runAppraisalInvariants(updatedAppraisal, "updateAppraisal");

    this.raise({
      type: "RealEstateAppraisalUpdated_V1",
      data: {
        id: this.id,
        appraisal: {
          id: updatedAppraisal.id,
          date: updatedAppraisal.date,
          value: updatedAppraisal.value.props,
        },
      },
      meta: { version: 1, timestamp: new Date() },
    });
  }

  public removeAppraisal(appraisalId: string) {
    this.ensureIsNotDeleted("removeAppraisal");
    invariants({
      aggregate: "RealEstate",
      id: this.id,
      operation: "removeAppraisal",
    })
      .ensure(
        `Appraisal with ID ${appraisalId} not found.`,
        "appraisal.not_found",
        this.props.appraisals.some((a) => a.id === appraisalId)
      )
      .throwIfAny();

    this.raise({
      type: "RealEstateAppraisalRemoved_V1",
      data: { id: this.id, appraisalId },
      meta: { version: 1, timestamp: new Date() },
    });
  }

  // NOTE: Valuations commands would be refactored in the exact same way as appraisals.
  // To keep this example concise, I've omitted them, but you would apply the same pattern.
  public addValuation(valuation: Valuation) {
    this.ensureIsNotDeleted("addValuation");
    this.runValuationInvariants(valuation, "addValuation");
    this.raise({
      type: "RealEstateValuationAdded_V1",
      data: {
        id: this.id,
        valuation: {
          id: valuation.id,
          date: valuation.date,
          value: valuation.value.props,
        },
      },
      meta: { version: 1, timestamp: new Date() },
    });
  }

  public updateValuation(
    valuationId: string,
    data: Partial<{ date: string; value: Money }>
  ) {
    this.ensureIsNotDeleted("updateValuation");
    const valuationToUpdate = this.props.valuations.find(
      (v) => v.id === valuationId
    );
    invariants({
      aggregate: "RealEstate",
      id: this.id,
      operation: "updateValuation",
    })
      .ensure(
        `Valuation with ID ${valuationId} not found.`,
        "valuation.not_found",
        !!valuationToUpdate
      )
      .throwIfAny();

    const updatedValuation = { ...valuationToUpdate!, ...data };
    this.runValuationInvariants(updatedValuation, "updateValuation");

    this.raise({
      type: "RealEstateValuationUpdated_V1",
      data: {
        id: this.id,
        valuation: {
          id: updatedValuation.id,
          date: updatedValuation.date,
          value: updatedValuation.value.props,
        },
      },
      meta: { version: 1, timestamp: new Date() },
    });
  }

  public removeValuation(valuationId: string) {
    this.ensureIsNotDeleted("removeValuation");
    invariants({
      aggregate: "RealEstate",
      id: this.id,
      operation: "removeValuation",
    })
      .ensure(
        `Valuation with ID ${valuationId} not found.`,
        "valuation.not_found",
        this.props.valuations.some((v) => v.id === valuationId)
      )
      .throwIfAny();

    this.raise({
      type: "RealEstateValuationRemoved_V1",
      data: { id: this.id, valuationId },
      meta: { version: 1, timestamp: new Date() },
    });
  }

  // --- Private Helpers ---

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
        !this.isDeleted
      )
      .throwIfAny();
  }
}
