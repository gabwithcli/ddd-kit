// apps/finance-api/src/application/real-estate.handler.ts

import { CommandHandler, ICommand, UnitOfWork } from "@acme/sdk-lite";
import { RealEstate } from "../../domain/real-estate/real-estate.aggregate";
import { RealEstateDrizzleRepo } from "../../infra/repo.real-estate.drizzle";
import { CreateRealEstateCommand } from "./commands/create.command";

type HandlerDependencies = {
  repo: RealEstateDrizzleRepo;
  uow: UnitOfWork;
  newId: () => string;
  now: () => Date;
};

export class RealEstateCommandHandler extends CommandHandler<
  RealEstate,
  RealEstateDrizzleRepo
> {
  protected readonly commands: Record<string, ICommand<any, any, RealEstate>>;

  constructor(deps: HandlerDependencies) {
    super(deps.repo, deps.uow);

    // We instantiate and map all commands for this aggregate here.
    this.commands = {
      createRealEstate: new CreateRealEstateCommand({
        newId: deps.newId,
        now: deps.now,
      }),
      // Other commands like 'addAppraisal' will be added here later.
    };
  }
}
