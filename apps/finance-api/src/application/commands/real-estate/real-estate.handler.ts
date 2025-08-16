// apps/finance-api/src/application/commands/real-estate/real-estate.handler.ts

import {
  AggregateRepository,
  CommandHandler,
  ICommand,
  UnitOfWork,
} from "@acme/sdk-lite";
import { RealEstate } from "../../../domain/real-estate/real-estate.aggregate";
import { RealEstateCommandsList } from "./commands.names";
import { CreateRealEstateCommand } from "./create/create.command";
import { DeleteRealEstateCommand } from "./delete/delete.command";

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
    this.commands = {
      ["create-real-estate"]: new CreateRealEstateCommand({
        newId: deps.newId,
        now: deps.now,
      }),
      ["delete-real-estate"]: new DeleteRealEstateCommand({
        now: deps.now,
      }),
      /* e.g., ["update-real-estate"]: new UpdateRealEstateCommand({ ... }), */
    };
  }
}
