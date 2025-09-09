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
import { RealEstateEventName } from "./real-estate.events";
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

// Updated class definition to pass the event names as a generic argument
export class RealEstate extends AggregateRoot<
  AggregateId<"RealEstate">,
  RealEstateEventName
> {
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

  // --- FACTORIES ---

  /**
   * The factory method for creating a new `RealEstate` aggregate.
   * It enforces creation invariants and then raises the initial `RealEstateAssetCreated` event.
   */
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

    // 3. Raise the creation event. The private `apply` in the base class will dispatch this
    // to the correct `applyRealEstateAssetCreated_V1` method below.
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
   * The `fromState` factory is used by CRUD-style repositories to "rehydrate"
   * an aggregate from a database snapshot. It directly restores the state
   * without raising any events.
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

  /**
   * The `fromHistory` factory is used by Event Sourcing repositories.
   * It creates a "blank" aggregate and then replays its entire history of
   * events to reconstruct its current state.
   *
   * @param id The ID of the aggregate.
   * @param events The historical events for this aggregate instance.
   */
  static fromHistory(
    id: AggregateId<"RealEstate">,
    events: DomainEvent<unknown>[]
  ) {
    // 1. Create a new, empty aggregate instance. It only knows its ID.
    const agg = new RealEstate(id, {} as RealEstateProps);

    // 2. Iterate through each historical event and apply it to the aggregate.
    // This is where the magic of the "Raise/Apply" pattern shines. We are reusing
    // the exact same `apply<EventName>` methods that are used during command
    // execution to rebuild the state from scratch.
    for (const event of events) {
      // @ts-expect-error
      agg.apply(event);
    }

    // 3. Return the fully rehydrated aggregate.
    return agg;
  }

  // --- STATE TRANSITION (APPLY METHODS) ---

  /**
   * These protected `apply<EventName>` methods are the ONLY places where state is mutated.
   * The `private apply()` method in the `AggregateRoot` base class acts as a dispatcher,
   * calling the correct method based on the event type. This pattern provides strong
   * type safety for each state transition.
   */
  protected applyRealEstateAssetCreated_V1(event: RealEstateAssetCreated) {
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
  }

  protected applyRealEstateAssetDetailsUpdated_V1(
    event: RealEstateAssetDetailsUpdated
  ) {
    this.props.details = {
      ...this.props.details,
      ...event.data.changes,
      address: event.data.changes.address
        ? Address.from(event.data.changes.address)
        : this.props.details.address,
    };
  }

  protected applyRealEstateAssetPurchaseUpdated_V1(
    event: RealEstateAssetPurchaseUpdated
  ) {
    this.props.purchase = {
      date: event.data.purchase.date,
      value: Money.from(
        event.data.purchase.value.amount,
        event.data.purchase.value.currency
      ),
    };
  }

  protected applyRealEstateAssetDeleted_V1(event: RealEstateAssetDeleted) {
    this.props.deletedAt = event.data.at;
  }

  protected applyRealEstateAppraisalAdded_V1(event: RealEstateAppraisalAdded) {
    this.props.appraisals.push({
      id: event.data.appraisal.id,
      date: event.data.appraisal.date,
      value: Money.from(
        event.data.appraisal.value.amount,
        event.data.appraisal.value.currency
      ),
    });
    this.props.appraisals.sort((a, b) => a.date.localeCompare(b.date));
  }

  protected applyRealEstateAppraisalUpdated_V1(
    event: RealEstateAppraisalUpdated
  ) {
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
  }

  protected applyRealEstateAppraisalRemoved_V1(
    event: RealEstateAppraisalRemoved
  ) {
    this.props.appraisals = this.props.appraisals.filter(
      (a) => a.id !== event.data.appraisalId
    );
  }

  protected applyRealEstateValuationAdded_V1(event: RealEstateValuationAdded) {
    this.props.valuations.push({
      id: event.data.valuation.id,
      date: event.data.valuation.date,
      value: Money.from(
        event.data.valuation.value.amount,
        event.data.valuation.value.currency
      ),
    });
    this.props.valuations.sort((a, b) => a.date.localeCompare(b.date));
  }

  protected applyRealEstateValuationUpdated_V1(
    event: RealEstateValuationUpdated
  ) {
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
  }

  protected applyRealEstateValuationRemoved_V1(
    event: RealEstateValuationRemoved
  ) {
    this.props.valuations = this.props.valuations.filter(
      (v) => v.id !== event.data.valuationId
    );
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

  /**
   * Command methods are the public API of the aggregate. They express business intent.
   * Their only job is to check invariants and then `raise` an event to signify a state change.
   * They do NOT mutate state directly.
   */
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
