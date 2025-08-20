// apps/finance-api/src/application/commands/real-estate/real-estate.handler.ts

import {
  AggregateRepository,
  CommandHandler,
  ICommand,
  UnitOfWork,
} from "@acme/sdk-lite";
import { RealEstate } from "../../../domain/real-estate/real-estate.aggregate";
import { AddAppraisalCommand } from "./add-appraisal/add-appraisal.command";
import { AddValuationCommand } from "./add-valuation/add-valuation.command";
import { RealEstateCommandsList } from "./commands.names";
import { CreateRealEstateAssetCommand } from "./create-real-estate-asset/create-real-estate-asset.command";
import { DeleteAppraisalCommand } from "./delete-appraisal/delete-appraisal.command";
import { DeleteRealEstateAssetCommand } from "./delete-real-estate-asset/delete-real-estate-asset.command";
import { DeleteValuationCommand } from "./delete-valuation/delete-valuation.command";
import { UpdateAppraisalCommand } from "./update-appraisal/update-appraisal.command";
import { UpdateRealEstateDetailsCommand } from "./update-real-estate-details/update-real-estate-details.command";
import { UpdateRealEstatePurchaseCommand } from "./update-real-estate-purchase/update-real-estate-purchase.command";
import { UpdateValuationCommand } from "./update-valuation/update-valuation.command";

// The dependencies for our handler now rely on the generic repository interface.
// This means we can pass in a CRUD repo, an ES repo, or even an in-memory repo
// for testing, as long as it fulfills the `AggregateRepository` contract.
type HandlerDependencies = {
  repo: AggregateRepository<RealEstate>;
  uow: UnitOfWork;
  newId: () => string;
  now: () => Date;
};

// This type definition remains the same.
type Commands = Record<RealEstateCommandsList, ICommand<any, any, RealEstate>>;

/**
 * RealEstateCommandHandler
 * ========================
 * This is the concrete implementation of the CommandHandler for the RealEstate aggregate.
 * It's responsible for instantiating all the command objects and mapping them to
 * command names.
 *
 * ## Refactoring Note ##
 * By extending `CommandHandler<RealEstate, AggregateRepository<RealEstate>>`, we
 * have now made this handler completely agnostic to the persistence mechanism.
 * Its only dependency is the abstract repository port. This is the final step
 * in achieving our goal of persistence flexibility.
 */
export class RealEstateCommandHandler extends CommandHandler<
  RealEstate,
  AggregateRepository<RealEstate>
> {
  protected readonly commands: Commands;

  constructor(deps: HandlerDependencies) {
    // The generic `CommandHandler` is designed to accept any `AggregateRepository`.
    super(deps.repo, deps.uow);

    // We instantiate and map all commands for this aggregate here.
    // The command objects operate on the aggregate in memory and are unaware of how it's loaded or saved.
    // This map links the command name string to its corresponding implementation.
    this.commands = {
      "create-real-estate-asset": new CreateRealEstateAssetCommand({
        newId: deps.newId,
        now: deps.now,
      }),
      "update-real-estate-details": new UpdateRealEstateDetailsCommand(),
      "update-real-estate-purchase": new UpdateRealEstatePurchaseCommand(),
      "delete-real-estate-asset": new DeleteRealEstateAssetCommand({
        now: deps.now,
      }),
      "add-appraisal": new AddAppraisalCommand({ newId: deps.newId }),
      "update-appraisal": new UpdateAppraisalCommand(),
      "delete-appraisal": new DeleteAppraisalCommand(),
      "add-valuation": new AddValuationCommand({ newId: deps.newId }),
      "update-valuation": new UpdateValuationCommand(),
      "delete-valuation": new DeleteValuationCommand(),
    };
  }
}
