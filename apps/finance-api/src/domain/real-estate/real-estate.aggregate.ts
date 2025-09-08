// ## File: apps/finance-api/src/domain/real-estate/real-estate.aggregate.ts

import { DomainEvent } from "ddd-kit";
import { AggregateId, AggregateRoot, invariants } from "ddd-kit/domain";
import { Money } from "../shared/money";
import { RealEstateAppraisalAdded } from "./events/real-estate-appraisal-added.event";
import { RealEstateAppraisalRemoved } from "./events/real-estate-appraisal-removed.event";
import { RealEstateAppraisalUpdated } from "./events/real-estate-appraisal-updated.event";
import { RealEstateAssetCreated } from "./events/real-estate-asset-created.event";
import { RealEstateAssetDeleted } from "./events/real-estate-asset-deleted.event";
import { RealEstateAssetDetailsUpdated } from "./events/real-estate-asset-details-updated.event";
import { RealEstateAssetPurchaseUpdated } from "./events/real-estate-asset-purchase-updated.event";
import { RealEstateValuationAdded } from "./events/real-estate-valuation-added.event";
import { RealEstateValuationRemoved } from "./events/real-estate-valuation-removed.event";
import { RealEstateValuationUpdated } from "./events/real-estate-valuation-updated.event";
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
   * 1. A single, comprehensive `apply` method handles all state changes
   *
   * This centralized `apply` method is the ONLY place where
   * the aggregate's state is allowed to change. It acts as a reducer,
   * mutating state based on the event it receives.
   */
  protected apply(event: DomainEvent<unknown>): void {
    // We use a switch on the event's static `type` property for organization.
    switch (event.type) {
      case RealEstateAssetCreated.type: {
        // We need to cast the event to its specific type to access its data.
        const ev = event as RealEstateAssetCreated;
        this.props.userId = ev.data.userId;
        this.props.details = {
          name: ev.data.details.name,
          address: Address.from(ev.data.details.address),
          notes: ev.data.details.notes,
          baseCurrency: ev.data.details.baseCurrency,
        };
        this.props.purchase = {
          date: ev.data.purchase.date,
          value: Money.from(
            ev.data.purchase.value.amount,
            ev.data.purchase.value.currency
          ),
        };
        this.props.appraisals = [];
        this.props.valuations = [];
        this.props.deletedAt = null;
        break;
      }
      case RealEstateAssetDetailsUpdated.type: {
        const ev = event as RealEstateAssetDetailsUpdated;
        this.props.details = {
          ...this.props.details,
          ...ev.data.changes,
          address: ev.data.changes.address
            ? Address.from(ev.data.changes.address)
            : this.props.details.address,
        };
        break;
      }
      case RealEstateAssetPurchaseUpdated.type: {
        const ev = event as RealEstateAssetPurchaseUpdated;
        this.props.purchase = {
          date: ev.data.purchase.date,
          value: Money.from(
            ev.data.purchase.value.amount,
            ev.data.purchase.value.currency
          ),
        };
        break;
      }
      case RealEstateAssetDeleted.type: {
        const ev = event as RealEstateAssetDeleted;
        this.props.deletedAt = ev.data.at;
        break;
      }
      case RealEstateAppraisalAdded.type: {
        const ev = event as RealEstateAppraisalAdded;
        this.props.appraisals.push({
          id: ev.data.appraisal.id,
          date: ev.data.appraisal.date,
          value: Money.from(
            ev.data.appraisal.value.amount,
            ev.data.appraisal.value.currency
          ),
        });
        this.props.appraisals.sort((a, b) => a.date.localeCompare(b.date));
        break;
      }
      case RealEstateAppraisalUpdated.type: {
        const ev = event as RealEstateAppraisalUpdated;
        const appraisalIndex = this.props.appraisals.findIndex(
          (a) => a.id === ev.data.appraisal.id
        );
        if (appraisalIndex !== -1) {
          this.props.appraisals[appraisalIndex] = {
            ...this.props.appraisals[appraisalIndex],
            date: ev.data.appraisal.date,
            value: Money.from(
              ev.data.appraisal.value.amount,
              ev.data.appraisal.value.currency
            ),
          };
          this.props.appraisals.sort((a, b) => a.date.localeCompare(b.date));
        }
        break;
      }
      case RealEstateAppraisalRemoved.type: {
        const ev = event as RealEstateAppraisalRemoved;
        this.props.appraisals = this.props.appraisals.filter(
          (a) => a.id !== ev.data.appraisalId
        );
        break;
      }
      case RealEstateValuationAdded.type: {
        const ev = event as RealEstateValuationAdded;
        this.props.valuations.push({
          id: ev.data.valuation.id,
          date: ev.data.valuation.date,
          value: Money.from(
            ev.data.valuation.value.amount,
            ev.data.valuation.value.currency
          ),
        });
        this.props.valuations.sort((a, b) => a.date.localeCompare(b.date));
        break;
      }
      case RealEstateValuationUpdated.type: {
        const ev = event as RealEstateValuationUpdated;
        const valuationIndex = this.props.valuations.findIndex(
          (v) => v.id === ev.data.valuation.id
        );
        if (valuationIndex !== -1) {
          this.props.valuations[valuationIndex] = {
            ...this.props.valuations[valuationIndex],
            date: ev.data.valuation.date,
            value: Money.from(
              ev.data.valuation.value.amount,
              ev.data.valuation.value.currency
            ),
          };
          this.props.valuations.sort((a, b) => a.date.localeCompare(b.date));
        }
        break;
      }
      case RealEstateValuationRemoved.type: {
        const ev = event as RealEstateValuationRemoved;
        this.props.valuations = this.props.valuations.filter(
          (v) => v.id !== ev.data.valuationId
        );
        break;
      }
    }
  }

  // --- FACTORIES ---

  // 2. Factories for creating new aggregates or rehydrating from state
  // validates and then calls this.raise()
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

    // 3. Raise the creation event by instantiating the event class.
    // This will call the `apply` method, which is now responsible for populating the initial state.
    agg.raise(
      new RealEstateAssetCreated({
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
      })
    );

    return agg;
  }

  /**
   * The `fromState` factory for CRUD remains unchanged. It's our "snapshot"
   * restoration mechanism and is key to keeping the aggregate persistence-agnostic.
   * directly rehydrates state for CRUD repositories
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
  // 3. Thin, expressive command methods that only raise events
  public updateDetails(
    newDetails: Partial<Omit<RealEstateDetails, "baseCurrency">>
  ) {
    this.ensureIsNotDeleted("updateDetails");
    this.raise(
      new RealEstateAssetDetailsUpdated({
        id: this.id,
        changes: {
          ...newDetails,
          address: newDetails.address ? newDetails.address.props : undefined,
        },
      })
    );
  }
  public updatePurchase(newPurchaseData: Partial<PricePoint>) {
    this.ensureIsNotDeleted("updatePurchase");
    const proposedPurchase = { ...this.props.purchase, ...newPurchaseData };
    this.raise(
      new RealEstateAssetPurchaseUpdated({
        id: this.id,
        purchase: {
          date: proposedPurchase.date,
          value: proposedPurchase.value.props,
        },
      })
    );
  }
  public deleteAsset(deletedAt: Date) {
    if (this.isDeleted) return;
    this.raise(new RealEstateAssetDeleted({ id: this.id, at: deletedAt }));
  }
  public addAppraisal(appraisal: Appraisal) {
    this.ensureIsNotDeleted("addAppraisal");
    this.runAppraisalInvariants(appraisal, "addAppraisal");
    this.raise(
      new RealEstateAppraisalAdded({
        id: this.id,
        appraisal: {
          id: appraisal.id,
          date: appraisal.date,
          value: appraisal.value.props,
        },
      })
    );
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
    this.raise(
      new RealEstateAppraisalUpdated({
        id: this.id,
        appraisal: {
          id: updatedAppraisal.id,
          date: updatedAppraisal.date,
          value: updatedAppraisal.value.props,
        },
      })
    );
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

    this.raise(new RealEstateAppraisalRemoved({ id: this.id, appraisalId }));
  }
  public addValuation(valuation: Valuation) {
    this.ensureIsNotDeleted("addValuation");
    this.runValuationInvariants(valuation, "addValuation");
    this.raise(
      new RealEstateValuationAdded({
        id: this.id,
        valuation: {
          id: valuation.id,
          date: valuation.date,
          value: valuation.value.props,
        },
      })
    );
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

    this.raise(
      new RealEstateValuationUpdated({
        id: this.id,
        valuation: {
          id: updatedValuation.id,
          date: updatedValuation.date,
          value: updatedValuation.value.props,
        },
      })
    );
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

    this.raise(new RealEstateValuationRemoved({ id: this.id, valuationId }));
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
