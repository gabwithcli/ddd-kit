// apps/finance-api/src/application/real-estate.handler.ts

import {
  AggregateCrudRepository,
  CommandHandler,
  ICommand,
  UnitOfWork,
} from "@acme/sdk-lite";
import { RealEstate } from "../../../domain/real-estate/real-estate.aggregate";
import { RealEstateCommandsList } from "./commands.names";
import { CreateRealEstateCommand } from "./create/create.command";

type HandlerDependencies = {
  repo: AggregateCrudRepository<RealEstate>;
  uow: UnitOfWork;
  newId: () => string;
  now: () => Date;
};

type Commands = Record<RealEstateCommandsList, ICommand<any, any, RealEstate>>;

export class RealEstateCommandHandler extends CommandHandler<
  RealEstate,
  AggregateCrudRepository<RealEstate>
> {
  protected readonly commands: Commands;

  constructor(deps: HandlerDependencies) {
    super(deps.repo, deps.uow);

    // We instantiate and map all commands for this aggregate here.
    this.commands = {
      ["create-real-estate"]: new CreateRealEstateCommand({
        ...deps,
      }),
      /* ["update-real-estate"]: new CreateRealEstateCommand({
        newId: deps.newId,
        now: deps.now,
      }),
      ["delete-real-estate"]: new CreateRealEstateCommand({
        newId: deps.newId,
        now: deps.now,
      }), */
    };
  }
}
