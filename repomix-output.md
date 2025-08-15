This file is a merged representation of the entire codebase, combined into a single document by Repomix.

# File Summary

## Purpose
This file contains a packed representation of the entire repository's contents.
It is designed to be easily consumable by AI systems for analysis, code review,
or other automated processes.

## File Format
The content is organized as follows:
1. This summary section
2. Repository information
3. Directory structure
4. Repository files (if enabled)
5. Multiple file entries, each consisting of:
  a. A header with the file path (## File: path/to/file)
  b. The full contents of the file in a code block

## Usage Guidelines
- This file should be treated as read-only. Any changes should be made to the
  original repository files, not this packed version.
- When processing this file, use the file path to distinguish
  between different files in the repository.
- Be aware that this file may contain sensitive information. Handle it with
  the same level of security as you would the original repository.

## Notes
- Some files may have been excluded based on .gitignore rules and Repomix's configuration
- Binary files are not included in this packed representation. Please refer to the Repository Structure section for a complete list of file paths, including binary files
- Files matching patterns in .gitignore are excluded
- Files matching default ignore patterns are excluded
- Files are sorted by Git change count (files with more changes are at the bottom)

# Directory Structure
```
apps/
  finance-api/
    docs/
      RealEstate-Aggregate.md
      RealEstate-Commands.md
    src/
      adapters/
        hono/
          commands/
            real-estate/
              old-routes/
                appraisal-add.handler.ts
                index.ts
                market-valuation-add.handler.ts
                root-create.handler.ts
                root-delete.handler.todo
                root-update.handler.ts
              real-estate.api-handler.ts
              real-estate.commands.ts
          types.ts
      application/
        commands.old/
          real-estate/
            add-appraisal.cmd.ts
            add-market-valuation.cmd.ts
            update-details.cmd.ts
        real-estate/
          commands/
            create.command.ts
          real-estate.handler.ts
      domain/
        real-estate/
          real-estate.aggregate.ts
          types.ts
        shared/
          money.ts
      infra/
        schema/
          index.ts
          real-estate.ts
        db.ts
        repo.real-estate.drizzle.ts
        uow.drizzle.ts
      routes/
        real-estate.routes.ts
      app.ts
      config.ts
      server.ts
    .dockerignore
    .gitignore
    Dockerfile
    package.json
    README.md
    tsconfig.json
packages/
  sdk-lite/
    docs/
      DECISIONS/
        0001-aggregate-boundary.md
      0-OVERVIEW.md
      00-EXAMPLES.md
      1-REQUEST_HANDLER.md
      2-IDEMPOTENCY.md
      3-ERRORS.md
      4-COMMANDS.md
      CQRS-Readme.md
      SDK-Lite.md
    src/
      application/
        command/
          crud/
            runner.ts
            types.ts
          es/
            runner.ts
            types.ts
          command.ts
          handler.ts
          index.ts
          types.ts
        repos/
          aggregate.crud.ts
          aggregate.es.ts
          index.ts
        policies.ts
      domain/
        aggregate.ts
        index.ts
        invariants.ts
      http/
        request-handler.ts
        respond.ts
      idempotency/
        types.ts
        with-idempotency.ts
      infra/
        idempotency-store.ts
        index.ts
        unit-of-work.ts
      memory/
        idempotency-store.memory.ts
        unit-of-work.memory.ts
      shared/
        errors.ts
        result.ts
      index.ts
    .gitignore
    .npmignore
    CHANGELOG.md
    package.json
    README.md
    tsconfig.json
    tsup.config.ts
.gitignore
.repomixignore
package.json
pnpm-workspace.yaml
repomix.config.json
tsconfig.json
```

# Files

## File: apps/finance-api/src/adapters/hono/commands/real-estate/old-routes/appraisal-add.handler.ts
````typescript
/**
 * Hono handler for AddAppraisal
 */
import { authFromContext, makeRequestHandler, ok } from "@acme/sdk-lite";
import { type Context } from "hono";
import {
  AddAppraisalBody,
  addAppraisal,
} from "../../../../application/commands.old/real-estate/add-appraisal.cmd";
import { Vars } from "../../types";

type Ctx = Context<{ Variables: Vars }>;

export const addAppraisalHandler = makeRequestHandler<
  Ctx,
  { userId: string },
  typeof AddAppraisalBody,
  { ok: true }
>({
  auth: authFromContext<Ctx>("userId"),
  bodySchema: AddAppraisalBody,
  map: ({ c, auth, body }) =>
    c.var.uow
      .withTransaction((tx) =>
        addAppraisal({ repo: c.var.reRepo }, tx, {
          id: c.req.param("id"),
          userId: auth.userId,
          ...body,
        })
      )
      .then(() => ok({ ok: true })),
});
````

## File: apps/finance-api/src/adapters/hono/commands/real-estate/old-routes/index.ts
````typescript
export { addAppraisalHandler } from "./appraisal-add.handler";
export { addMarketValuationHandler } from "./market-valuation-add.handler";
export { createRealEstateHandler } from "./root-create.handler";
export { updateRealEstateDetailsHandler } from "./root-update.handler";
````

## File: apps/finance-api/src/adapters/hono/commands/real-estate/old-routes/market-valuation-add.handler.ts
````typescript
/**
 * Hono handler for AddMarketValuation
 */
import { authFromContext, makeRequestHandler, ok } from "@acme/sdk-lite";
import { type Context } from "hono";
import {
  AddMarketValuationBody,
  addMarketValuation,
} from "../../../../application/commands.old/real-estate/add-market-valuation.cmd";
import { Vars } from "../../types";

type Ctx = Context<{ Variables: Vars }>;

export const addMarketValuationHandler = makeRequestHandler<
  Ctx,
  { userId: string },
  typeof AddMarketValuationBody,
  { ok: true }
>({
  auth: authFromContext<Ctx>("userId"),
  bodySchema: AddMarketValuationBody,
  map: ({ c, auth, body }) =>
    c.var.uow
      .withTransaction((tx) =>
        addMarketValuation({ repo: c.var.reRepo }, tx, {
          id: c.req.param("id"),
          userId: auth.userId,
          ...body,
        })
      )
      .then(() => ok({ ok: true })),
});
````

## File: apps/finance-api/src/adapters/hono/commands/real-estate/old-routes/root-create.handler.ts
````typescript
/**
 * Hono handler for CreateRealEstate
 * - Auth: requires `userId` in context vars
 * - Body: validated with CreateRealEstateBody (Zod)
 * - Runs inside UnitOfWork transaction
 */
import { authFromContext, makeRequestHandler, ok } from "@acme/sdk-lite";
import { type Context } from "hono";
import {
  CreateRealEstateBody,
  createRealEstate,
} from "../../../../../application/real-estate/commands/create.command";
import { Vars } from "../../../types";

type Ctx = Context<{ Variables: Vars }>;

export const createRealEstateHandler = makeRequestHandler<
  Ctx,
  { userId: string },
  typeof CreateRealEstateBody,
  { id: string }
>({
  auth: authFromContext<Ctx>("userId"),
  bodySchema: CreateRealEstateBody,
  map: ({ c, auth, body }) =>
    c.var.uow
      .withTransaction((tx) =>
        createRealEstate(
          { repo: c.var.reRepo, newId: c.var.env.newId, now: c.var.env.now },
          tx,
          { userId: auth.userId, ...body }
        )
      )
      .then(ok),
});
````

## File: apps/finance-api/src/adapters/hono/commands/real-estate/old-routes/root-delete.handler.todo
````

````

## File: apps/finance-api/src/adapters/hono/commands/real-estate/old-routes/root-update.handler.ts
````typescript
/**
 * Hono handler for UpdateRealEstateDetails
 */
import { authFromContext, makeRequestHandler, ok } from "@acme/sdk-lite";
import { type Context } from "hono";
import {
  UpdateRealEstateDetailsBody,
  updateRealEstateDetails,
} from "../../../../application/commands.old/real-estate/update-details.cmd";
import { Vars } from "../../types";

type Ctx = Context<{ Variables: Vars }>;

export const updateRealEstateDetailsHandler = makeRequestHandler<
  Ctx,
  { userId: string },
  typeof UpdateRealEstateDetailsBody,
  { ok: true }
>({
  auth: authFromContext<Ctx>("userId"),
  bodySchema: UpdateRealEstateDetailsBody,
  map: ({ c, auth, body }) =>
    c.var.uow
      .withTransaction((tx) =>
        updateRealEstateDetails({ repo: c.var.reRepo }, tx, {
          id: c.req.param("id"),
          userId: auth.userId,
          ...body,
        })
      )
      .then(() => ok({ ok: true })),
});
````

## File: apps/finance-api/src/adapters/hono/commands/real-estate/real-estate.api-handler.ts
````typescript
// apps/finance-api/src/adapters/hono/commands/real-estate/real-estate.api-handler.ts

import { authFromContext, makeRequestHandler } from "@acme/sdk-lite";
import { type Context } from "hono";
import { Vars } from "../../types";
import { RealEstateCommandRequest } from "./real-estate.commands";

type Ctx = Context<{ Variables: Vars }>;

export const realEstateApiHandler = makeRequestHandler<
  Ctx,
  { userId: string },
  typeof RealEstateCommandRequest,
  unknown
>({
  // 1. Authenticate the request.
  auth: authFromContext<Ctx>("userId"),
  // 2. Validate the request body.
  bodySchema: RealEstateCommandRequest,
  // 3. Map the request to the application layer.
  map: ({ c, auth, body }) => {
    const handler = c.var.reCmdHandler;
    const aggregateId = c.req.param("id");

    // Enrich the client payload with the authenticated userId.
    const payloadWithAuth = { ...body.payload, userId: auth.userId };

    // Execute the command.
    return handler.execute(body.command, {
      aggregateId,
      payload: payloadWithAuth, 
    });
  },
});
````

## File: apps/finance-api/src/adapters/hono/commands/real-estate/real-estate.commands.ts
````typescript
import z from "zod";
import { CreateRealEstatePayloadSchema } from "../../../../application/real-estate/commands/create.command";

// This Zod schema validates the generic command envelope from the client.
export const RealEstateCommandRequest = z.discriminatedUnion("command", [
  z.object({
    command: z.literal("createRealEstate"),
    payload: CreateRealEstatePayloadSchema,
  }),
  // ... schemas for other commands will be added here
]);


// ^^ move this into application/real-estate/** 

// also rename application to "modules"
````

## File: apps/finance-api/src/application/commands.old/real-estate/add-appraisal.cmd.ts
````typescript
/**
 * AddAppraisal command:
 * - Loads the aggregate
 * - Applies domain behavior (addAppraisal)
 * - Persists atomically
 * - Returns { id }
 */
import { AggregateCrudRepository, Tx } from "@acme/sdk-lite";
import { z } from "zod";
import {
  RealEstate,
  pp,
} from "../../../domain/real-estate/real-estate.aggregate";

/**
 * Zod body schema used by the request-handler at the edge.
 * Route will merge path param `:id` + auth into the command DTO.
 */
export const AddAppraisalBody = z.object({
  amount: z.number().positive(),
  date: z.string(), // ISO date string
});

type Env = {
  repo: AggregateCrudRepository<RealEstate>;
  // clock not required here; pp(date, amount, currency) already takes date string
};

export type AddAppraisalCmd = {
  id: string; // from route param
  userId: string; // from auth
  amount: number;
  date: string;
};

export type AddAppraisalRes = { id: string };

export async function addAppraisal(
  env: Env,
  tx: Tx,
  cmd: AddAppraisalCmd
): Promise<AddAppraisalRes> {
  const current = await env.repo.load(tx, cmd.id);
  if (!current) throw new Error("RealEstate not found");
  if (current.userId !== cmd.userId) throw new Error("Forbidden");

  current.addAppraisal(pp(cmd.date, cmd.amount, current.details.baseCurrency));

  await env.repo.save(tx, current);
  return { id: current.id };
}
````

## File: apps/finance-api/src/application/commands.old/real-estate/add-market-valuation.cmd.ts
````typescript
/**
 * AddMarketValuation command:
 * - Loads the aggregate
 * - Applies domain behavior (addMarketValuation)
 * - Persists atomically
 * - Returns { id }
 */
import { AggregateCrudRepository, Tx } from "@acme/sdk-lite";
import { z } from "zod";
import {
  RealEstate,
  pp,
} from "../../../domain/real-estate/real-estate.aggregate";

/**
 * Zod body schema used by the request-handler at the edge.
 */
export const AddMarketValuationBody = z.object({
  amount: z.number().positive(),
  date: z.string(), // ISO date string
});

type Env = {
  repo: AggregateCrudRepository<RealEstate>;
};

export type AddMarketValuationCmd = {
  id: string; // from route param
  userId: string; // from auth
  amount: number;
  date: string;
};

export type AddMarketValuationRes = { id: string };

export async function addMarketValuation(
  env: Env,
  tx: Tx,
  cmd: AddMarketValuationCmd
): Promise<AddMarketValuationRes> {
  const current = await env.repo.load(tx, cmd.id);
  if (!current) throw new Error("RealEstate not found");
  if (current.userId !== cmd.userId) throw new Error("Forbidden");

  current.addMarketValuation(
    pp(cmd.date, cmd.amount, current.details.baseCurrency)
  );

  await env.repo.save(tx, current);
  return { id: current.id };
}
````

## File: apps/finance-api/src/application/commands.old/real-estate/update-details.cmd.ts
````typescript
/**
 * UpdateRealEstateDetails command:
 * - Loads the aggregate
 * - Applies domain behavior (updateDetails)
 * - Persists atomically
 * - Returns { id }
 */
import { AggregateCrudRepository, Tx } from "@acme/sdk-lite";
import { z } from "zod";
import { RealEstate } from "../../../domain/real-estate/real-estate.aggregate";
import { Address } from "../../../domain/real-estate/types";

/**
 * Zod body schema used by the request-handler at the edge.
 * All fields optional; domain will validate invariants (e.g., name cannot be empty if provided).
 */
export const UpdateRealEstateDetailsBody = z.object({
  name: z.string().min(1).optional(),
  address: z
    .object({
      line1: z.string(),
      line2: z.string().optional(),
      postalCode: z.string(),
      city: z.string(),
      state: z.string().optional(),
      country: z.string(),
    })
    .optional(),
  notes: z.string().optional(),
});

type Env = {
  repo: AggregateCrudRepository<RealEstate>;
};

export type UpdateRealEstateDetailsCmd = {
  id: string; // from route param
  userId: string; // from auth
  name?: string;
  address?: {
    line1: string;
    line2?: string;
    postalCode: string;
    city: string;
    state?: string;
    country: string;
  };
  notes?: string;
};

export type UpdateRealEstateDetailsRes = { id: string };

export async function updateRealEstateDetails(
  env: Env,
  tx: Tx,
  cmd: UpdateRealEstateDetailsCmd
): Promise<UpdateRealEstateDetailsRes> {
  const current = await env.repo.load(tx, cmd.id);
  if (!current) throw new Error("RealEstate not found");
  if (current.userId !== cmd.userId) throw new Error("Forbidden");

  current.updateDetails({
    name: cmd.name,
    address: cmd.address ? Address.of(cmd.address) : undefined,
    notes: cmd.notes,
  });

  await env.repo.save(tx, current);
  return { id: current.id };
}
````

## File: apps/finance-api/src/application/real-estate/commands/create.command.ts
````typescript
// apps/finance-api/src/application/commands/real-estate/create.command.ts

import { CommandOutput, ICommand, ok, Result } from "@acme/sdk-lite";
import { z } from "zod";
import {
  pp,
  RealEstate,
} from "../../../domain/real-estate/real-estate.aggregate";
import { Address } from "../../../domain/real-estate/types";

// This schema defines just the data payload for the command.
export const CreateRealEstatePayloadSchema = z.object({
  details: z.object({
    name: z.string().min(1, "Name is required"),
    address: z.object({
      line1: z.string().min(1, "Address line1 is required"),
      line2: z.string().optional(),
      postalCode: z.string().min(1, "Postal code is required"),
      city: z.string().min(1, "City is required"),
      state: z.string().optional(),
      country: z.string().min(1, "Country is required"),
    }),
    notes: z.string().optional(),
    baseCurrency: z.string().length(3, "Use 3-letter currency code"),
  }),
  purchase: z.object({
    date: z.string(), // ISO date string
    value: z.number().positive(),
  }),
});

// The full payload for the command's execute method, including the userId.
type CommandPayload = z.infer<typeof CreateRealEstatePayloadSchema> & {
  userId: string;
};

type CommandResponse = { id: string };

type CommandDependencies = {
  newId(): string;
  now(): Date;
};

export class CreateRealEstateCommand
  implements ICommand<CommandPayload, CommandResponse, RealEstate>
{
  constructor(private readonly deps: CommandDependencies) {}

  public execute(
    payload: CommandPayload,
    aggregate?: RealEstate
  ): Result<CommandOutput<RealEstate, CommandResponse>> {
    if (aggregate) {
      throw new Error("Cannot create a RealEstate that already exists.");
    }

    // The aggregate's factory enforces all business invariants.
    const newAggregate = RealEstate.create({
      id: `re_${this.deps.newId()}`,
      userId: payload.userId, // userId is now passed directly
      details: {
        name: payload.details.name,
        address: Address.of(payload.details.address),
        notes: payload.details.notes,
        baseCurrency: payload.details.baseCurrency,
      },
      purchase: pp(
        payload.purchase.date,
        payload.purchase.value,
        payload.details.baseCurrency
      ),
      now: () => this.deps.now().toISOString(),
    });

    // On success, we wrap the new aggregate and response DTO in a `Result.ok`.
    return ok({
      aggregate: newAggregate,
      response: { id: newAggregate.id },
      events: newAggregate.pullEvents(),
    });
  }
}
````

## File: apps/finance-api/src/application/real-estate/real-estate.handler.ts
````typescript
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
````

## File: .repomixignore
````
# Add patterns to ignore here, one per line
# Example:
# *.log
# tmp/
````

## File: repomix.config.json
````json
{
  "$schema": "https://repomix.com/schemas/latest/schema.json",
  "input": {
    "maxFileSize": 52428800
  },
  "output": {
    "filePath": "repomix-output.md",
    "style": "markdown",
    "parsableStyle": false,
    "fileSummary": true,
    "directoryStructure": true,
    "files": true,
    "removeComments": false,
    "removeEmptyLines": false,
    "compress": false,
    "topFilesLength": 5,
    "showLineNumbers": false,
    "truncateBase64": false,
    "copyToClipboard": false,
    "tokenCountTree": false,
    "git": {
      "sortByChanges": true,
      "sortByChangesMaxCommits": 100,
      "includeDiffs": false
    }
  },
  "include": [],
  "ignore": {
    "useGitignore": true,
    "useDefaultPatterns": true,
    "customPatterns": []
  },
  "security": {
    "enableSecurityCheck": true
  },
  "tokenCount": {
    "encoding": "o200k_base"
  }
}
````

## File: apps/finance-api/docs/RealEstate-Aggregate.md
````markdown
# RealEstate Aggregate

## Invariants
- Purchase is mandatory on creation
- Appraisal/Market valuation dates ≥ purchase date
- All price points share baseCurrency

## Commands
- `createRealEstate`
- `addAppraisal`
- `addMarketValuation`
- `updateRealEstateDetails`

## Persistence
- CRUD: `real_estates` + child tables, `version` for optimistic concurrency
- ES (optional): events emitted by the aggregate are appended and projected to read models later
````

## File: apps/finance-api/docs/RealEstate-Commands.md
````markdown
# RealEstate Commands

## createRealEstate
Input: details (name, address, baseCurrency, notes), purchase (date, value)
Output: { id }

## addAppraisal
Input: id, date, amount
Rules: date ≥ purchaseDate; currency = baseCurrency

## addMarketValuation
Input: id, date, amount
Rules: date ≥ purchaseDate; currency = baseCurrency

## updateRealEstateDetails
Input: id, (name?), (address?), (notes?)
Rules: name must not be empty; baseCurrency is immutable
````

## File: apps/finance-api/src/domain/shared/money.ts
````typescript
import { ValueObject } from "@acme/sdk-lite/domain";

/**
 * Money
 * -----
 * Value Object che rappresenta un importo monetario in una specifica valuta.
 * - Immutabile: ogni operazione ritorna una nuova istanza (niente mutazioni in place).
 * - Uguaglianza per valore: due Money sono uguali se amount e currency coincidono.
 * - Invarianti interne: amount deve essere finito, currency valida e consentita.
 */
export class Money extends ValueObject<{ amount: number; currency: string }> {
  // Whitelist di valute ammesse. Se prevedi molte valute o configurazioni runtime,
  // sposta questa lista in una dependency (es. AppEnv) e passala alla factory.
  private static readonly ALLOWED = [
    "EUR",
    "USD",
    "GBP",
    "CHP",
    "DKK",
  ] as const;

  /**
   * Metodo privato che centralizza la creazione di Money garantendo tutte le invarianti interne.
   * Usato sia da `of` che da `from` per mantenere DRY e consistenza.
   */
  private static create(amount: number, currency: string) {
    // 1) amount deve essere un numero finito (niente NaN/Infinity)
    if (!Number.isFinite(amount)) {
      throw new Error("Amount must be a finite number");
    }

    // 2) normalizza e valida il formato della currency (tre lettere A-Z)
    const cur = currency.toUpperCase();
    if (!/^[A-Z]{3}$/.test(cur)) {
      throw new Error(`Invalid currency format: ${currency}`);
    }

    // 3) vincolo di lista ammessa (business rule locale all'app)
    if (!Money.ALLOWED.includes(cur as (typeof Money.ALLOWED)[number])) {
      // Nota: se vuoi separare "formato valido" da "valuta non permessa",
      // puoi usare errori diversi (es. DomainInvariantError) e mapparli a 422.
      throw new Error(`Currency not allowed: ${cur}`);
    }

    return new Money({ amount, currency: cur });
  }

  /**
   * Factory method: crea un Money garantendo tutte le invarianti interne.
   * @param amount Importo in unità monetarie (es. 100.50 = 100 euro e 50 cent)
   * @param currency Codice valuta (verrà normalizzato a MAIUSCOLO)
   */
  static of(amount: number, currency: string) {
    return this.create(amount, currency);
  }

  /**
   * Alias di `of` per contesti in cui `from` risulta più leggibile.
   * @param amount Importo in unità monetarie
   * @param currency Codice valuta
   */
  static from(amount: number, currency: string) {
    return this.create(amount, currency);
  }

  /**
   * Somma due Money della stessa valuta e ritorna un nuovo Money.
   * Fallisce se le valute non combaciano (preveniamo errori silenziosi).
   */
  add(other: Money): Money {
    this.ensureSameCurrency(other, "add");
    return new Money({
      amount: this.amount + other.amount,
      currency: this.currency,
    });
  }

  /**
   * Sottrae "other" da questo Money e ritorna un nuovo Money.
   * Anche qui, le valute devono combaciare.
   */
  subtract(other: Money): Money {
    this.ensureSameCurrency(other, "subtract");
    return new Money({
      amount: this.amount - other.amount,
      currency: this.currency,
    });
  }

  // --- Helpers interni ------------------------------------------------------

  /** Garantisce che le valute coincidano prima di operazioni aritmetiche. */
  private ensureSameCurrency(other: Money, op: "add" | "subtract") {
    if (this.currency !== other.currency) {
      throw new Error(
        `Currency mismatch in ${op}(): ${this.currency} vs ${other.currency}`
      );
    }
  }

  /** Importo numerico (immutabile) */
  get amount(): number {
    return this.props.amount;
  }

  /** Valuta ISO-like (normalizzata a maiuscolo) */
  get currency(): string {
    return this.props.currency;
  }
}
````

## File: apps/finance-api/src/infra/schema/index.ts
````typescript
export * from "./real-estate";
````

## File: apps/finance-api/src/infra/schema/real-estate.ts
````typescript
import { date, integer, numeric, pgTable, varchar } from "drizzle-orm/pg-core";

export const realEstates = pgTable("real_estates", {
  id: varchar("id", { length: 40 }).primaryKey(),
  userId: varchar("user_id", { length: 40 }).notNull(),
  name: varchar("name", { length: 256 }).notNull(),
  addr1: varchar("addr1", { length: 256 }).notNull(),
  addr2: varchar("addr2", { length: 256 }),
  postalCode: varchar("postal_code", { length: 32 }).notNull(),
  city: varchar("city", { length: 128 }).notNull(),
  state: varchar("state", { length: 128 }),
  country: varchar("country", { length: 64 }).notNull(),
  notes: varchar("notes", { length: 2000 }),
  baseCurrency: varchar("base_currency", { length: 3 }).notNull(),
  purchaseDate: date("purchase_date").notNull(),
  purchaseValue: numeric("purchase_value", {
    precision: 14,
    scale: 2,
  })
    .$type<number>()
    .notNull(),
  version: integer("version").notNull().default(0),
});

export const realEstateAppraisals = pgTable("real_estate_appraisals", {
  realEstateId: varchar("real_estate_id", { length: 40 }).notNull(),
  date: date("date").notNull(),
  value: numeric("value", { precision: 14, scale: 2 })
    .$type<number>()
    .notNull(),
});

export const realEstateMarketVals = pgTable("real_estate_market_vals", {
  realEstateId: varchar("real_estate_id", { length: 40 }).notNull(),
  date: date("date").notNull(),
  value: numeric("value", { precision: 14, scale: 2 })
    .$type<number>()
    .notNull(),
});
````

## File: apps/finance-api/src/infra/db.ts
````typescript
// src/infra/db.ts
import { drizzle, type NodePgDatabase } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import * as schema from "./schema"; // barrel that re-exports tables

export const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

// Give Drizzle the schema => enables db.query.<table> with types
export const db: NodePgDatabase<typeof schema> = drizzle(pool, { schema });

// Re-export the schema type if you want to use it elsewhere
export type DB = typeof db;
````

## File: apps/finance-api/src/infra/uow.drizzle.ts
````typescript
// src/infra/uow.drizzle.ts
import type { Tx, UnitOfWork } from "@acme/sdk-lite/infra";
import type { NodePgDatabase } from "drizzle-orm/node-postgres";
import { db } from "./db";
import * as schema from "./schema";

type DrizzleTx = NodePgDatabase<typeof schema>;

export const DrizzleUoW: UnitOfWork = {
  async withTransaction<T>(fn: (tx: Tx) => Promise<T>): Promise<T> {
    // tx is typed as NodePgDatabase<typeof schema>
    return db.transaction(async (tx) => fn(tx as unknown as Tx));
  },
};

// Helper for repos to “unwrap” Tx when needed
export const asDrizzle = (tx: Tx) => tx as unknown as DrizzleTx;
````

## File: apps/finance-api/src/config.ts
````typescript
import { z } from "zod";

const Env = z.object({
  PORT: z.coerce.number().default(3000),
  NODE_ENV: z.enum(["development", "production"]).default("development"),
  POSTHOG_HOST: z.string().url().default("https://eu.posthog.com"),
});

export const env = Env.parse(process.env);
````

## File: apps/finance-api/src/server.ts
````typescript
import { serve } from "@hono/node-server";
import app from "./app";
import { env } from "./config";

serve({ fetch: app.fetch, port: env.PORT });
console.log(`Hono listening on :${env.PORT}`);
````

## File: apps/finance-api/.dockerignore
````
node_modules
dist
.git
.gitignore
Dockerfile
docker-compose.yml
.env
````

## File: apps/finance-api/.gitignore
````
# dev
.yarn/
!.yarn/releases
.vscode/*
!.vscode/launch.json
!.vscode/*.code-snippets
.idea/workspace.xml
.idea/usage.statistics.xml
.idea/shelf
dist/

# deps
node_modules/

# env
.env
.env.production

# logs
logs/
*.log
npm-debug.log*
yarn-debug.log*
yarn-error.log*
pnpm-debug.log*
lerna-debug.log*

# misc
.DS_Store
````

## File: apps/finance-api/Dockerfile
````
# --- builder ---
FROM node:20-alpine AS build
WORKDIR /app

# Enable pnpm
RUN corepack enable && corepack prepare pnpm@9.0.0 --activate

# deps first for better caching
COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile

# build (your "build" script runs esbuild to emit dist/index.js)
COPY tsconfig.json ./
COPY src ./src
RUN pnpm build

# --- runtime ---
FROM node:20-alpine
WORKDIR /app
ENV NODE_ENV=production

# With esbuild bundling, you don't need node_modules at runtime
COPY --from=build /app/dist ./dist

USER node
EXPOSE 3000
HEALTHCHECK --interval=30s --timeout=3s --start-period=20s --retries=3 \
  CMD node -e 'fetch("http://127.0.0.1:3000/healthz").then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))'

CMD ["node", "dist/index.js"]
````

## File: apps/finance-api/README.md
````markdown
```
npm install
npm run dev
```

```
open http://localhost:3000
```
# tamo-backend-hono
````

## File: apps/finance-api/tsconfig.json
````json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "moduleResolution": "Bundler",
    "outDir": "dist",
    "strict": true,
    "esModuleInterop": true,
    "resolveJsonModule": true,
    "types": ["node"]
  },
  "include": ["src"]
}
````

## File: packages/sdk-lite/docs/DECISIONS/0001-aggregate-boundary.md
````markdown
# ADR-0001 Aggregate Boundary for RealEstate

## Context
A "Real Estate Asset" comprises user-provided details and a timeline of price points (purchase, appraisals, market valuations).

## Decision
- Single aggregate root: **RealEstate** (`re_<ulid>`)
- Inside boundary: `details`, `purchase`, `appraisals[]`, `marketValuations[]`
- Base currency is immutable post-creation
- Commands must not cross aggregate boundaries

## Consequences
- Simple transactional invariants (date, currency)
- If history grows large, we may split timelines into a separate aggregate
````

## File: packages/sdk-lite/docs/0-OVERVIEW.md
````markdown
# SDK Overview

`@acme/sdk-lite` provides small, composable building blocks for backend services:

- **Result**: `ok/err`
- **Domain errors**: `DomainInvariantError`
- **Infra ports**: `UnitOfWork`, `IdempotencyStore`
- **Idempotency**: `withIdempotency` for safe command retries
- **HTTP**: `makeRequestHandler`, `respond`, `authFromContext`
- **Test doubles**: `InMemoryUoW`, `InMemoryIdempotencyStore`

Bring your own domain (entities, policies, repos) and wire them to these primitives.
````

## File: packages/sdk-lite/docs/00-EXAMPLES.md
````markdown
# Example usage from an app (draft)

In your service (e.g., apps/orders-service), you could do:

```ts
// deps.ts
import {
  withIdempotency, IdempotencyStore, UnitOfWork,
  makeRequestHandler, authFromContext, respond, ok, err,
  DomainInvariantError, InMemoryUoW, InMemoryIdempotencyStore
} from "@acme/sdk-lite";
import { z } from "zod";

// Prod impls:
const UoW: UnitOfWork = /* drizzle.transaction wrapper */;
const IdemStore: IdempotencyStore = /* Postgres or Redis impl */;

// Command handler:
export function makeCreateOrderHandler(deps: {
  uow: UnitOfWork;
  store: IdempotencyStore;
  hash: (s: string) => string;
  clock: { now(): Date };
  newId: () => string;
  orderRepo: { save(o: any, tx: any): Promise<void> };
  vendorRepo: { exists(id: string): Promise<boolean>; isBlocked(id: string): Promise<boolean> };
}) {
  return {
    handle: (cmd: { userId: string; vendorId: string; items: any[]; idempotencyKey: string | null }) =>
      withIdempotency<{ orderId: string; totalCents: number }>(
        { options: {
          key: cmd.idempotencyKey,
          command: "CreateOrder",
          scope: { userId: cmd.userId },
          payload: { vendorId: cmd.vendorId, items: cmd.items }
        }},
        { uow: deps.uow, store: deps.store, hash: deps.hash },
        async (tx) => {
          if (!(await deps.vendorRepo.exists(cmd.vendorId))) return err(new DomainInvariantError("Vendor does not exist"));
          if (await deps.vendorRepo.isBlocked(cmd.vendorId)) return err(new DomainInvariantError("Vendor is blocked"));
          const orderId = deps.newId();
          const totalCents = cmd.items.reduce((s, it) => s + it.qty * it.unitPriceCents, 0);
          await deps.orderRepo.save({ id: orderId, ...cmd, totalCents }, tx);
          return ok({ orderId, totalCents });
        }
      )
  };
}

// Route:
const CreateBody = z.object({
  vendorId: z.string().min(1),
  items: z.array(z.object({
    sku: z.string().min(1),
    qty: z.number().int().positive(),
    unitPriceCents: z.number().int().nonnegative()
  })).min(1),
  idempotencyKey: z.string().min(1).nullable()
});

export const handleCreateOrderRequest = makeRequestHandler({
  auth: authFromContext("userId"),
  bodySchema: CreateBody,
  map: ({ auth, body }) => ok({ userId: auth.userId, ...body })
});
```

Testing with in‑memory deps in an app:

```ts
import { describe, it, expect } from "vitest";
import { InMemoryUoW, InMemoryIdempotencyStore } from "@acme/sdk-lite";
import { makeCreateOrderHandler } from "../src/handlers/orders"; // your app code

describe("CreateOrder", () => {
  it("creates an order and is idempotent", async () => {
    const handler = makeCreateOrderHandler({
      uow: InMemoryUoW,
      store: new InMemoryIdempotencyStore(),
      hash: (s) => s, // for test simplicity
      clock: { now: () => new Date("2025-01-01") },
      newId: () => "order_1",
      orderRepo: { save: async () => {} },
      vendorRepo: { exists: async () => true, isBlocked: async () => false }
    });

    const cmd = { userId: "u1", vendorId: "v1", items: [{ sku: "A", qty: 1, unitPriceCents: 100 }], idempotencyKey: "k1" };

    const a = await handler.handle(cmd);
    const b = await handler.handle(cmd);

    expect(a.ok && b.ok).toBe(true);
    expect(a.ok && b.ok && b.value.orderId).toBe(a.value.orderId); // same result
  });
});
```

## Why this packaging works

- Tiny, composable surface — Just the primitives you need; no framework lock‑in.
- Strong typing — IdempotencyConfigOptions<T> is generic over your handler’s output.
- Testability — In‑memory UoW and idempotency store let you write end‑to‑end app tests without a DB.
- Portability — Works with Hono, Express, Fastify (or no HTTP at all).
- Docs included — .md files so teammates can browse concepts quickly.
````

## File: packages/sdk-lite/docs/1-REQUEST_HANDLER.md
````markdown
# Request Handler

## Purpose
Centralize edge concerns:
- Auth (from framework context)
- JSON parsing
- Zod validation
- Mapping to an executor DTO

## Example with Hono

```ts
import { makeRequestHandler, authFromContext, respond, ok } from "@acme/sdk-lite";
import { z } from "zod";

const CreateBody = z.object({
  vendorId: z.string().min(1),
  idempotencyKey: z.string().min(1).nullable(),
});

const handleCreate = makeRequestHandler({
  auth: authFromContext("userId"),
  bodySchema: CreateBody,
  map: ({ auth, body }) => ok({ userId: auth.userId, ...body })
});

app.post("/orders", async (c) => {
  const req = await handleCreate(c);
  if (!req.ok) return respond(c, req);
  const res = await appHandler.handle(req.value);
  return respond(c, res, 201);
});
```
````

## File: packages/sdk-lite/docs/2-IDEMPOTENCY.md
````markdown
# Idempotency

## Why
Prevent duplicate side-effects when clients retry commands.

## How
Use `withIdempotency` to wrap command execution:
1) `tryClaim` (atomic)
2) if cached → return revived result
3) else run + `saveResponse`

## Config shape
```ts
{ 
  options: {
    key: string | null;
    command: string;
    scope: Record<string, string>;
    payload: unknown;
    toResponse?: (value) => unknown;
    reviveOnHit?: (data) => value;
    clock?: { now(): Date };
  }
}
```

## Infra deps
- uow (UnitOfWork) — your transaction adapter
- store — idempotency storage (PG, Redis, DynamoDB, etc.)
- hash — stable hash function (sha256 recommended)

See src/idempotency/withIdempotency.ts
````

## File: packages/sdk-lite/docs/3-ERRORS.md
````markdown
# Errors & HTTP Mapping

- **DomainInvariantError** — throw inside domain/policy checks; map to 422.
- **EdgeError** — standard shapes returned by request handlers.

Use `respond()` to convert `Result<T, EdgeError>` to HTTP.
Customize `statusOf()` per service if needed.
````

## File: packages/sdk-lite/docs/4-COMMANDS.md
````markdown
# Command Blueprints (CRUD + ES)

This module offers **two runners** so teams don’t reinvent command execution:

- **CRUD**: `makeCrudCommand({ load, policies?, run, save, publish? })`
- **Event Sourcing**: `makeEsCommand({ load, policies?, run, append, publish? })`

Both flows:

1. **PREP** (load history or state)
2. **CHECK** policies (invariants)
3. **EXEC** command logic
4. **SAVE** (persist state or append events)
5. **PUB** (optional event publisher)

Use together with:
- `withIdempotency()` — safe retries
- `UnitOfWork` — transaction/context
- `makeRequestHandler()` — edge validation

See `crud/` and `es/` source files for detailed comments and types.

## Policies

Write small and focused, business rules:
```ts
predicatePolicy("Vendor must exist", async ({ env, cmd }) => env.vendorRepo.exists(cmd.vendorId))
```

Combine many policies by passing an array. The blueprint runs them in order and stops on the first error.

## Idempotency + UoW

Wrap your blueprint call in withIdempotency() and provide a UnitOfWork (DB tx or ES context).
This keeps commands safe to retry and ensures consistency.

## CRUD vs ES
- CRUD → run returns { next, response }, and save writes the new state.
- ES → run returns { toAppend, response }, and append writes events with optimistic concurrency.

See the examples in this doc for wiring with in-memory adapters. In production, swap in real repos, UoW, and idempotency store. 

## Tiny usage examples

### CRUD
```ts
const createOrder = makeCrudCommand({
  load: async ({ tx, env, cmd }) => null,
  policies: [
    predicatePolicy("Must have items", ({ cmd }) => cmd.items.length > 0),
  ],
  run: async ({ current, env, cmd }) => {
    const id = env.newId();
    const next = { id, ...cmd, createdAt: env.now() };
    const totalCents = cmd.items.reduce((s, it) => s + it.qty * it.unitPriceCents, 0);
    return ok({ next, response: { orderId: id, totalCents } });
  },
  save: async ({ next, env, tx }) => env.orderRepo.save(tx, next),
});
```

### ES
```ts
const createOrderEs = makeEsCommand({
  load: async ({ tx, env, cmd }) => env.es.readStream(`order-${cmd.orderId}`),
  policies: [
    predicatePolicy("Must have items", ({ cmd }) => cmd.items.length > 0),
  ],
  run: async ({ past, env, cmd }) => {
    const events = [{ type: "OrderCreated", data: { ...cmd, at: env.now().toISOString() } }];
    const totalCents = cmd.items.reduce((s, it) => s + it.qty * it.unitPriceCents, 0);
    return ok({ toAppend: events, response: { orderId: cmd.orderId, totalCents } });
  },
  append: async ({ env, cmd, tx, toAppend, expectedRevision }) =>
    env.es.appendToStream(`order-${cmd.orderId}`, toAppend, expectedRevision),
});
```
````

## File: packages/sdk-lite/docs/CQRS-Readme.md
````markdown
# CQRS in @acme/sdk-lite

**Writes:** enact a single aggregate mutation per command.
**Reads:** shape whatever view you want (joins, projections, caches).

Benefits:
- Write models stay clean and enforce rules.
- Read models can evolve without risking write-side complexity.
- Eventual consistency is OK for reads; strong consistency on the aggregate boundary for writes.
````

## File: packages/sdk-lite/docs/SDK-Lite.md
````markdown
# @acme/sdk-lite — Overview

**Purpose:** give small teams a pragmatic toolkit for:
- Command execution with idempotency + UoW
- CRUD or Event Sourced storage
- DDD tactical patterns (Entity, ValueObject, AggregateRoot)

## Design Principles
- **Domain first.** Invariants live inside aggregate methods.
- **Small, explicit boundaries.** One aggregate per command.
- **Storage agnostic.** CRUD today, ES tomorrow—same domain code.

## Key Building Blocks
- `domain/aggregate.ts`: Entity, ValueObject, AggregateRoot, DomainInvariantError
- `application/repos/aggregate.crud.ts`: CRUD repo port (load/save)
- `application/repos/aggregate.es.ts`: ES repo port (load/append)
- Command runners (in your app): load → mutate → save/append → publish

## Concurrency
- CRUD: integer `version` column (+ optimistic concurrency)
- ES: `expectedRevision` on streams

## Errors
- Throw `DomainInvariantError` for rule violations → map to HTTP 422
````

## File: packages/sdk-lite/src/application/command/crud/types.ts
````typescript
/**
 * CRUD Blueprint Types
 * --------------------
 * Use these when your aggregate is persisted as rows/documents (classic CRUD).
 * The runner composes the pipeline:
 *   PREP (load) -> CHECK (policies) -> EXEC (run) -> SAVE (persist) -> PUB (optional)
 */

import type { Tx } from "../../../infra/unit-of-work";
import type { Result } from "../../../shared/result";
import type { DomainEvent } from "../types";

/**
 * load:
 *   Load the current aggregate (or null for creations).
 *   Use the provided Tx to ensure any reads happen inside the same unit of work.
 */
export type CrudLoader<TAgg, TCmd, TEnv> = (args: {
  tx: Tx;
  env: TEnv;
  cmd: TCmd;
}) => Promise<TAgg>;

/**
 * run:
 *   Apply the command to the aggregate and produce:
 *     - next: the next aggregate state to persist
 *     - response: DTO you’ll return to the caller
 *     - events?: optional domain events to publish
 */
export type CrudRunner<TAgg, TCmd, TEnv, TOut> = (args: {
  current: TAgg;
  env: TEnv;
  cmd: TCmd;
  tx: Tx;
}) => Promise<
  Result<{
    next: TAgg;
    response: TOut;
    events?: DomainEvent[];
  }>
>;

/**
 * save:
 *   Persist the next aggregate state using the same Tx.
 */
export type CrudSaver<TAgg, TEnv> = (args: {
  next: TAgg;
  env: TEnv;
  tx: Tx;
}) => Promise<void>;

/**
 * publish (optional):
 *   Send events to your bus. If you don’t need events, skip it.
 */
export type CrudPublisher = (events: DomainEvent[], tx: Tx) => Promise<void>;
````

## File: packages/sdk-lite/src/application/command/es/types.ts
````typescript
/**
 * ES (Event Sourcing) Blueprint Types
 * -----------------------------------
 * Use these when your aggregate is persisted by appending events.
 * The runner composes:
 *   PREP (load history) -> CHECK (policies) -> EXEC (new events) -> APPEND -> PUB
 */

import type { Tx } from "../../../infra/unit-of-work";
import type { Result } from "../../../shared/result";
import type { DomainEvent } from "../types";

/**
 * load:
 *   Read the aggregate's past events (or snapshot+tail) and current revision.
 *   expectedRevision is used to enforce optimistic concurrency on append.
 */
export type EsLoader<TCmd, TEnv> = (args: {
  tx: Tx;
  env: TEnv;
  cmd: TCmd;
}) => Promise<{
  events: DomainEvent[];
  revision: bigint | number | "no_stream";
}>;

/**
 * run:
 *   Given the past events, derive the new events the command should append.
 *   Also compute a response DTO for the caller.
 */
export type EsRunner<TCmd, TEnv, TOut> = (args: {
  past: DomainEvent[];
  env: TEnv;
  cmd: TCmd;
  tx: Tx;
}) => Promise<
  Result<{
    toAppend: DomainEvent[];
    response: TOut;
  }>
>;

/**
 * append:
 *   Persist the new events with optimistic concurrency (expectedRevision).
 */
export type EsAppender<TCmd, TEnv> = (args: {
  env: TEnv;
  cmd: TCmd;
  tx: Tx;
  toAppend: DomainEvent[];
  expectedRevision: bigint | number | "no_stream";
}) => Promise<void>;

/**
 * publish (optional):
 *   Emit events to your bus, if needed (outbox, pub/sub, etc.).
 */
export type EsPublisher = (events: DomainEvent[], tx: Tx) => Promise<void>;
````

## File: packages/sdk-lite/src/application/command/command.ts
````typescript
/**
 * Defines the contract for a Command.
 * A command encapsulates the logic for a single atomic business operation.
 * It is decoupled from infrastructure concerns like persistence and transactions.
 */
import { AggregateRoot } from "../../domain/aggregate";
import type { Result } from "../../shared/result";
import type { DomainEvent } from "./types";

/**
 * The result of a successful command execution.
 * It contains the next state of the aggregate, any domain events that were raised,
 * and the response DTO to be returned to the caller.
 */
export type CommandOutput<T extends AggregateRoot, TResponse> = {
  aggregate: T;
  events: DomainEvent[];
  response: TResponse;
};

/**
 * ICommand Interface
 * @template TPayload - The data transfer object (DTO) for the command's input.
 * @template TResponse - The data transfer object (DTO) for the successful response.
 * @template TAggregate - The type of Aggregate Root this command operates on.
 */
export interface ICommand<
  TPayload,
  TResponse,
  TAggregate extends AggregateRoot
> {
  /**
   * Executes the command's logic.
   * @param payload - The input data for the command.
   * @param aggregate - The current state of the aggregate. This will be `undefined` for creation commands.
   * @returns A Result object containing a CommandOutput on success, or an error on failure.
   */
  execute(
    payload: TPayload,
    aggregate?: TAggregate
  ):
    | Promise<Result<CommandOutput<TAggregate, TResponse>>>
    | Result<CommandOutput<TAggregate, TResponse>>;
}
````

## File: packages/sdk-lite/src/application/command/handler.ts
````typescript
// packages/sdk-lite/src/application/command/handler.ts

/**
 * Abstract Command Handler
 * This class provides a reusable, transactional pipeline for executing commands against an aggregate.
 * It automates the "load -> execute -> save" flow.
 */
import { AggregateRoot } from "../../domain/aggregate";
import type { UnitOfWork } from "../../infra";
import { err, ok, type Result } from "../../shared/result";
import type { AggregateCrudRepository } from "../repos";
import type { ICommand } from "./command";

/**
 * Defines the structure of the payload passed to the command handler's execute method.
 * It must contain the command payload and optionally the ID of the aggregate to operate on.
 */
export type CommandHandlerPayload<T> = {
  aggregateId?: string;
  payload: T;
};

export abstract class CommandHandler<
  TAggregate extends AggregateRoot,
  TRepo extends AggregateCrudRepository<TAggregate>
> {
  // The concrete handler will provide a map of command names to command implementations.
  protected abstract commands: Record<string, ICommand<any, any, TAggregate>>;

  constructor(
    protected readonly repo: TRepo,
    protected readonly uow: UnitOfWork
  ) {}

  /**
   * The main public method to execute a command.
   * It orchestrates the entire operation within a single transaction.
   *
   * @param commandName - The name of the command to execute (e.g., "create", "addAppraisal").
   * @param data - The data for the command, including the payload and optional aggregateId.
   * @returns The result of the command execution, which is the response DTO from the command itself.
   */
  public async execute<TPayload, TResponse>(
    commandName: string,
    data: CommandHandlerPayload<TPayload>
  ): Promise<Result<TResponse>> {
    const command = this.commands[commandName];
    if (!command) {
      return err(
        new Error(`Command "${commandName}" not found on this handler.`)
      );
    }

    return this.uow.withTransaction(async (tx) => {
      // 1. LOAD: Explicitly handle loading for existing aggregates.
      // For creation commands, the aggregate correctly starts as `undefined`.
      let aggregate: TAggregate | undefined = undefined;
      if (data.aggregateId) {
        const loadedAggregate = await this.repo.load(tx, data.aggregateId);
        if (!loadedAggregate) {
          return err(
            new Error(`Aggregate with id ${data.aggregateId} not found.`)
          );
        }
        aggregate = loadedAggregate;
      }

      // 2. EXECUTE: Run the specific command's logic.
      const result = await command.execute(data.payload, aggregate);

      if (!result.ok) {
        // If the command's invariants fail, we forward the error.
        return err(result.error);
      }

      // 3. DESTRUCTURE: The command output contains the next state and the response.
      const { aggregate: nextAggregate, response } = result.value;

      // 4. SAVE: Persist the new state of the aggregate.
      // This works for both creations and updates.
      await this.repo.save(tx, nextAggregate);

      // 5. PUBLISH (Future): You would pull and publish domain events here.
      // const events = nextAggregate.pullEvents();
      // await this.eventPublisher.publish(events);

      // 6. RETURN: Return the successful response DTO.
      return ok(response);
    });
  }
}
````

## File: packages/sdk-lite/src/application/command/types.ts
````typescript
/**
 * Common types for command execution across storage styles.
 *
 * This layer is deliberately small, so apps only provide the minimum needed:
 * - How to load the aggregate (or its events)
 * - How to check domain policies (invariants)
 * - How to apply the command to produce either:
 *      CRUD: new aggregate state (plus optional events)
 *      ES:   new events (plus optional projected value)
 * - How to persist (save state or append events)
 * - How to publish events (optional)
 */

import type { Tx } from "../../infra/unit-of-work";
import type { Result } from "../../shared/result";

/** A small identity map if you need it; most apps won’t. */
export type Context = Record<string, unknown>;

/** Represents the input that reaches the command executor (your DTO). */
export type CommandInput = Record<string, unknown>;

/** Policy check result – you can return ok/err, or just throw DomainInvariantError in policies. */
export type PolicyResult = Result<true, unknown>;

/** Basic event type for cross-domain helpers. Keep it serializable. */
export type DomainEvent = {
  type: string;
  data: unknown;
  meta?: Record<string, unknown>;
};

/** Optional publisher port */
export interface EventPublisher {
  publish(events: DomainEvent[], tx: Tx): Promise<void>;
}
````

## File: packages/sdk-lite/src/application/repos/aggregate.crud.ts
````typescript
/**
 * CRUD repository port for aggregates.
 * Concrete adapters (e.g., Drizzle, Prisma) implement this for each aggregate type.
 *
 * Contract:
 * - load(tx, id): returns the *fully rehydrated* aggregate (root + children) or null.
 * - save(tx, agg): persists root + children and enforces optimistic concurrency.
 */
import type { AggregateRoot } from "../../domain/aggregate";
import type { Tx } from "../../infra/unit-of-work";

export interface AggregateCrudRepository<AR extends AggregateRoot> {
  load(tx: Tx, id: string): Promise<AR | null>;
  save(tx: Tx, agg: AR): Promise<void>;
}
````

## File: packages/sdk-lite/src/application/repos/aggregate.es.ts
````typescript
/**
 * Event Sourcing repository port.
 * - Minimal surface so you can adapt to any ES backend (EventStoreDB, Dynamo streams, Postgres, etc).
 */
export type DomainEvent = { type: string; data: unknown; timestamp?: string };

export interface AggregateEsRepository {
  loadStream(
    tx: unknown,
    streamId: string
  ): Promise<{
    events: DomainEvent[];
    revision: number | "no_stream";
  }>;

  appendToStream(
    tx: unknown,
    streamId: string,
    events: DomainEvent[],
    expectedRevision: number | "no_stream"
  ): Promise<void>;
}
````

## File: packages/sdk-lite/src/application/repos/index.ts
````typescript
/**
 * Aggregate repos primitives.
 * Re-export CRUD and ES flavors from a single place
 */

export * from "./aggregate.crud";
export * from "./aggregate.es";
````

## File: packages/sdk-lite/src/application/policies.ts
````typescript
import { err, ok, type Result } from "../shared/result";

/**
 * A Policy is a small function that checks a single rule.
 * - If the rule is satisfied → return ok(true)
 * - If the rule is violated → return err(someErrorPayload) OR throw a DomainInvariantError
 *
 * Keep policies tiny and focused. Chain several to cover all invariants.
 */
export type Policy<TEnv, TCmd> = (args: {
  env: TEnv; // your injected deps (repos, read models, caches)
  cmd: TCmd; // the command DTO
}) => Promise<Result<true>> | Result<true>;

/**
 * Combine multiple policies into one.
 * - Evaluates in order
 * - Returns first error encountered
 * - Short-circuits on error
 */
export function allPolicies<TEnv, TCmd>(
  policies: Policy<TEnv, TCmd>[]
): Policy<TEnv, TCmd> {
  return async ({ env, cmd }) => {
    for (const p of policies) {
      const r = await p({ env, cmd });
      if (!r.ok) return r;
    }
    return ok(true);
  };
}

/**
 * A tiny helper to adapt a boolean predicate into a Policy.
 * Example:
 *    predicatePolicy("Must have items", () => items.length > 0)
 */
export function predicatePolicy<TEnv, TCmd>(
  message: string,
  predicate: (args: { env: TEnv; cmd: TCmd }) => boolean | Promise<boolean>
): Policy<TEnv, TCmd> {
  return async (args) =>
    (await predicate(args)) ? ok(true) : err({ message });
}
````

## File: packages/sdk-lite/src/domain/aggregate.ts
````typescript
import { deepEqual } from "node:assert";

/**
 * re-export DomainInvariantError and other shared errors,
 * so apps can just write:
 *
 * import { AggregateRoot, DomainInvariantError } from "@acme/sdk-lite/domain";
 *
 */
export * from "../shared/errors"; // re-export DomainInvariantError (and other shared errors)

/**
 * DDD tactical patterns in lightweight TypeScript.
 *
 * Why this exists:
 * - We want domain rules to live *in the model*, not in controllers or handlers.
 * - Aggregates provide a transactional consistency boundary. All writes flow through the root.
 * - Storage-agnostic: works with CRUD (ORM) or ES (event store) backends.
 */

export type AggregateId = string;

/**
 * Marker for optimistic concurrency control.
 * - CRUD: version = row_version (incremented per successful commit)
 * - ES:   version = last event position (or stream revision)
 */
export interface HasVersion {
  version: number;
}

/**
 * Base Entity: identified by id; equality by identity.
 * Keep this small: don’t leak infra concerns here.
 */
export abstract class Entity<Id extends AggregateId = AggregateId> {
  constructor(public readonly id: Id) {}
}

/**
 * Base Value Object: equality by value.
 * Implementation notes:
 * - We use Node.js assert.deepEqual for robust comparison.
 * - Props are readonly to encourage immutability.
 */
export abstract class ValueObject<T extends object> {
  protected constructor(public readonly props: Readonly<T>) {}
  equals(other: ValueObject<T>): boolean {
    try {
      deepEqual(this.props, other.props);
      return true;
    } catch {
      return false;
    }
  }
}

/**
 * AggregateRoot:
 * - Guards invariants for the whole aggregate.
 * - Only entry point for state changes (public methods).
 * - Buffers domain events to support ES, outbox, and telemetry.
 */
export abstract class AggregateRoot<Id extends AggregateId = AggregateId>
  extends Entity<Id>
  implements HasVersion
{
  public version = 0;

  // In-memory event buffer; handlers drain with pullEvents()
  private readonly _events: Array<{ type: string; data: unknown }> = [];

  /**
   * Record a domain event.
   * - In CRUD mode: you may publish these via outbox to keep analytics/read-sides in sync.
   * - In ES mode: these are what you append to the event store.
   */
  protected record(type: string, data: unknown) {
    this._events.push({ type, data });
  }

  /**
   * Drain and return pending domain events.
   * MUST be called by the application layer (command runner) after successful guards.
   */
  pullEvents() {
    const out = [...this._events];
    this._events.length = 0;
    return out;
  }
}
````

## File: packages/sdk-lite/src/domain/invariants.ts
````typescript
// sdk-lite/src/domain/invariants.ts
// -----------------------------------------------------------------------------
// Invariant DSL for aggregates (domain-only, no I/O)
//
// Why this exists
// ---------------
// - Invariants are the "always true" rules of an aggregate's internal state.
// - We want them *inside* the domain, but written in a way that's readable
//   ("English-like") and returns *structured* information for the edge layer.
// - We accumulate *all* violations and throw once, so the UI can show a rich
//   error (e.g., multiple fields invalid) without trial-and-error.
// - We reuse the platform's canonical DomainInvariantError so HTTP mappers,
//   logs, and tests stay consistent across the codebase.
//
// What this is NOT
// ----------------
// - This is not for external/contextual checks (e.g., plan limits, flags,
//   uniqueness across the DB). Those belong to application-level *policies*.
//   Keep a clean separation: "intrinsic rules" (invariants) vs "context rules"
//   (policies).
//
// Typical usage
// -------------
//   invariants({ aggregate: "RealEstate", operation: "create" })
//     .ensure("Name is required.", "real_estate.name_required", name.trim() !== "", { name })
//     .ensure("Purchase currency must match baseCurrency.", "real_estate.currency_matches", purchase.currency === baseCurrency,
//             { purchaseCurrency: purchase.currency, baseCurrency })
//     .must("Purchase date must be a valid ISO-8601 date.", "real_estate.purchase_date_valid",
//           () => !Number.isNaN(Date.parse(purchase.date)), { purchaseDate: purchase.date })
//     .throwIfAny("RealEstate.Invalid");
// -----------------------------------------------------------------------------

import { DomainInvariantError } from "../shared/errors";

// A single invariant failure, with a readable message and a stable key for i18n/tests.
// "details" are free-form structured data useful for debugging and telemetry.
export type InvariantViolation = {
  message: string; // e.g. "Name is required."
  key: string; // e.g. "real_estate.name_required"
  details?: Record<string, unknown>;
};

// Shape of the error.details payload we attach to DomainInvariantError.
// "violations" is what UIs typically render; "context" adds high-level info.
export type InvariantErrorDetails = {
  violations: InvariantViolation[]; // all collected violations
  context?: Record<string, unknown>; // optional: aggregate id, op, etc.
};

/**
 * Build an invariant collector
 * - Use `.ensure` when you already have a boolean condition
 * - Use `.must` when you want lazy evaluation (we wrap try/catch)
 * - Call `.throwIfAny()` once at the end to throw a single DomainInvariantError
 *
 * @param context optional structured info included in `error.details.context`
 */
export function invariants(context?: Record<string, unknown>) {
  // Internal buffer of violations (we don't throw immediately).
  const violations: InvariantViolation[] = [];

  // Push a violation into the buffer with a readable message, a stable key,
  // and optional structured details (useful for logs and UIs).
  function push(
    message: string,
    key: string,
    details?: Record<string, unknown>
  ) {
    violations.push({ message, key, details });
  }

  /**
   * Ensure a condition that you've already evaluated.
   * Prefer this when expressing "simple truths" inline without lambdas.
   *
   * Example:
   *   .ensure("Name is required.", "real_estate.name_required", name.trim() !== "")
   */
  function ensure(
    message: string,
    key: string,
    condition: boolean,
    details?: Record<string, unknown>
  ) {
    if (!condition) push(message, key, details);
    return api;
  }

  /**
   * Ensure a condition that's best expressed as a function.
   * We catch exceptions and convert them into a structured violation,
   * preventing domain code from leaking stack traces to callers.
   *
   * Example:
   *   .must("Purchase date must be ISO-8601.", "purchase_date_valid", () => !Number.isNaN(Date.parse(purchase.date)))
   */
  function must(
    message: string,
    key: string,
    predicate: () => boolean,
    details?: Record<string, unknown>
  ) {
    try {
      const ok = !!predicate();
      if (!ok) push(message, key, details);
    } catch (err) {
      // Convert unexpected predicate errors into a violation with extra context
      push(message, `${key}.exception`, {
        ...details,
        error: (err as Error)?.message,
      });
    }
    return api;
  }

  /**
   * Throw a single DomainInvariantError if any violation was recorded.
   * - Message is compact (first violation + a "+N more" suffix) so logs stay tidy.
   * - The full list lives in `error.details.violations`.
   * - By default, DomainInvariantError.code is "DOMAIN_INVARIANT_VIOLATION";
   *   pass a custom code to override it for finer-grained client handling.
   */
  function throwIfAny(customCode?: string) {
    if (violations.length === 0) return;

    // Compact, human-friendly message for logs:
    const first = violations[0]?.message ?? "Domain invariant(s) violated";
    const suffix =
      violations.length > 1 ? ` (+${violations.length - 1} more)` : "";
    const message = `${first}${suffix}`;

    const details: InvariantErrorDetails = { violations, context };
    const err = new DomainInvariantError(message, details);

    // Optional override (non-breaking): allow domain code to set a more specific code.
    if (customCode) (err as any).code = customCode;

    throw err;
  }

  /**
   * Expose collected violations without throwing.
   * Handy for "dry-run" validations in tests or pre-checks.
   */
  function toArray() {
    return violations;
  }

  const api = { ensure, must, throwIfAny, toArray };
  return api;
}

/**
 * Userland type guard for narrowing unknown errors in adapters/tests
 * without importing the class in every file. Also works with errors thrown
 * by this DSL, which attach `details.violations`.
 */
export function isDomainInvariantError(
  e: unknown
): e is DomainInvariantError & { details?: InvariantErrorDetails } {
  return (
    !!e &&
    typeof e === "object" &&
    (e as any).name === "DomainInvariantError" &&
    typeof (e as any).code === "string"
  );
}
````

## File: packages/sdk-lite/src/http/respond.ts
````typescript
import type { EdgeError } from "../shared/errors";
import type { Result } from "../shared/result";

/**
 * statusOf
 * --------
 * Maps an EdgeError shape into an HTTP status code.
 * Adjust this mapping per service if needed.
 */
export function statusOf(e: EdgeError): number {
  switch (e.kind) {
    case "Unauthorized":
      return 401;
    case "BadRequest":
      return 400;
    case "NotFound":
      return 404;
    case "InvariantViolation":
      return 422; // semantic rule failed
    case "Conflict":
      return 409;
    case "Infrastructure":
      return 503;
    default:
      return 400;
  }
}

/**
 * respond
 * -------
 * Turn a Result<T, EdgeError> into an HTTP response using your framework's "c".
 * - Success → json(value, successStatus)
 * - Error   → json({ error }, statusOf(error))
 *
 * This keeps route handlers tiny and consistent.
 */
export function respond<T>(
  c: any,
  r: Result<T, EdgeError>,
  successStatus = 200
) {
  return r.ok
    ? c.json(r.value, successStatus)
    : c.json({ error: r.error }, statusOf(r.error));
}
````

## File: packages/sdk-lite/src/idempotency/with-idempotency.ts
````typescript
import type { Tx } from "../infra/unit-of-work";
import { ok, type Result } from "../shared/result";
import type { IdempotencyConfigOptions, IdempotencyInfra } from "./types";

/**
 * withIdempotency
 * ---------------
 * Wrap a command execution so retries return the same result instead of
 * performing the action again.
 *
 * Flow:
 * 1) If options.key is null → skip idempotency; just run inside a transaction.
 * 2) Else:
 *    a) tryClaim:
 *        - if {response} → return it (short-circuit, no side-effects)
 *        - if "claimed"  → proceed to run the command
 *    b) run(tx) → your real command logic (returns Result<T>)
 *    c) if ok → saveResponse with a canonical object; return result
 *       if err → return error (we don't cache failures)
 */
export async function withIdempotency<T>(
  config: { options: IdempotencyConfigOptions<T> },
  infra: IdempotencyInfra,
  run: (tx: Tx) => Promise<Result<T>>
): Promise<Result<T>> {
  const { options } = config;
  const { uow, store, hash } = infra;

  // Fast path: no idempotency
  if (options.key === null) {
    return uow.withTransaction(run);
  }

  // Compute hashes (small stable strings) to scope and identify "same" payloads.
  const now = options.clock?.now() ?? new Date();
  const scopeHash = hash(JSON.stringify(options.scope));
  const payloadHash = hash(JSON.stringify(options.payload));

  return uow.withTransaction(async (tx) => {
    // Step a) Claim or short-circuit if result exists
    const claimed = await store.tryClaim({
      key: options.key!,
      command: options.command,
      scopeHash,
      payloadHash,
      now,
      tx,
    });

    if (claimed !== "claimed") {
      // Cached response → build the value and return
      const revive = options.reviveOnHit ?? ((r: unknown) => r as T);
      return ok(revive(claimed.response));
    }

    // Step b) Execute the real work
    const res = await run(tx);
    if (!res.ok) return res; // On failure, do not cache

    // Step c) Canonicalize and persist the response for future retries
    const toResp = options.toResponse ?? ((v: T) => v);
    await store.saveResponse({
      key: options.key!,
      command: options.command,
      scopeHash,
      response: toResp(res.value),
      tx,
    });

    return res;
  });
}
````

## File: packages/sdk-lite/src/infra/index.ts
````typescript
// packages/sdk-lite/src/infra/index.ts

export * from "./idempotency-store"; // IdempotencyStore
export * from "./unit-of-work"; // Tx, UnitOfWork
````

## File: packages/sdk-lite/src/memory/idempotency-store.memory.ts
````typescript
import type { IdempotencyStore } from "../infra/idempotency-store";
import type { Tx } from "../infra/unit-of-work";

/**
 * InMemoryIdempotencyStore
 * ------------------------
 * Test/local adapter for IdempotencyStore. DO NOT use in production:
 * - No TTL cleanup
 * - No cross-process visibility
 * - No durability
 */
export class InMemoryIdempotencyStore implements IdempotencyStore {
  private map = new Map<string, { response?: unknown }>();

  /** Combines command + scope + key into one string. */
  private keyOf(key: string, command: string, scopeHash: string) {
    return `${command}::${scopeHash}::${key}`;
  }

  async tryClaim(args: {
    key: string;
    command: string;
    scopeHash: string;
    payloadHash: string;
    now: Date;
    tx: Tx;
  }): Promise<"claimed" | { response: unknown }> {
    const k = this.keyOf(args.key, args.command, args.scopeHash);

    // If this is the first time we see the key → "claim" it by inserting an empty row.
    if (!this.map.has(k)) {
      this.map.set(k, {}); // claimed but no response yet
      return "claimed";
    }

    // If a response exists → short-circuit retry with the same response.
    const row = this.map.get(k)!;
    if (row.response !== undefined) return { response: row.response };

    // Otherwise: already claimed and still in-flight → treat as claimed.
    return "claimed";
  }

  async saveResponse(args: {
    key: string;
    command: string;
    scopeHash: string;
    response: unknown;
    tx: Tx;
  }): Promise<void> {
    const k = this.keyOf(args.key, args.command, args.scopeHash);
    const row = this.map.get(k) ?? {};
    row.response = args.response;
    this.map.set(k, row);
  }
}
````

## File: packages/sdk-lite/src/memory/unit-of-work.memory.ts
````typescript
import type { Tx, UnitOfWork } from "../infra/unit-of-work";

/**
 * InMemoryUoW (InMemoryUnitOfWork)
 * -----------
 * Testing adapter for UnitOfWork:
 * - It doesn't start a real DB transaction.
 * - It simply calls the function with a dummy Tx object.
 *
 * Use this in tests to run command handlers without a database.
 * In production, provide a real UoW (e.g., drizzle.transaction wrapper).
 */
export const InMemoryUoW: UnitOfWork = {
  withTransaction: async <T>(fn: (tx: Tx) => Promise<T>) => fn({} as Tx),
};
````

## File: packages/sdk-lite/src/shared/errors.ts
````typescript
/**
 * DomainInvariantError
 * --------------------
 * Throw this from your **domain** or **policy** code when business rules are violated.
 * Example: "Order must have at least one item" or "Vendor is blocked".
 *
 * Why a custom error?
 * - Lets the HTTP layer map it to 422 Unprocessable Entity (semantic error).
 * - Keeps business rules clearly identified and separate from infrastructure issues.
 */
export class DomainInvariantError extends Error {
  /** Stable error code that clients/tests can rely on. */
  public readonly code = "DOMAIN_INVARIANT_VIOLATION";

  constructor(message: string, public readonly details?: unknown) {
    super(message);
    this.name = "DomainInvariantError";
  }
}

/**
 * EdgeError
 * ---------
 * These are error shapes typically produced at the **request/edge** layer,
 * before domain logic runs (auth, parsing, schema validation).
 * Your HTTP responder will translate them into status codes.
 */
export type EdgeError =
  | { kind: "Unauthorized"; message?: string }
  | { kind: "BadRequest"; message: string; details?: unknown }
  | { kind: "NotFound"; entity?: string; id?: string }
  | { kind: "InvariantViolation"; message: string; details?: unknown }
  | { kind: "Conflict"; message: string }
  | { kind: "Infrastructure"; message: string };
````

## File: packages/sdk-lite/.gitignore
````
# dev
.yarn/
!.yarn/releases
.vscode/*
!.vscode/launch.json
!.vscode/*.code-snippets
.idea/workspace.xml
.idea/usage.statistics.xml
.idea/shelf
dist/

# deps
node_modules/

# env
.env
.env.production

# logs
logs/
*.log
npm-debug.log*
yarn-debug.log*
yarn-error.log*
pnpm-debug.log*
lerna-debug.log*

# misc
.DS_Store
````

## File: packages/sdk-lite/.npmignore
````
src
tsconfig.json
tsup.config.ts
*.map
*.log
.DS_Store
docs
````

## File: packages/sdk-lite/CHANGELOG.md
````markdown
# Changelog

## 2025-08-13: 0.1.0
- Initial release: Result, DomainInvariantError, UoW & IdempotencyStore ports
- withIdempotency orchestration
- HTTP request-handler & responder helpers
- In-memory UoW and Idempotency store for tests
````

## File: packages/sdk-lite/README.md
````markdown
# @acme/sdk-lite

Lightweight CQRS/DDD helpers for backend services:

- `Result` helpers (`ok/err`)
- `DomainInvariantError`
- Ports: `UnitOfWork`, `IdempotencyStore`
- `withIdempotency` wrapper
- HTTP helpers: `makeRequestHandler`, `respond`, `authFromContext`
- In-memory adapters for tests

## Install

```bash
npm i @acme/sdk-lite zod
# or: pnpm add @acme/sdk-lite zod
```

## Quick Start

```ts
import {
  ok, err,
  withIdempotency,
  InMemoryUoW, InMemoryIdempotencyStore
} from "@acme/sdk-lite";

const res = await withIdempotency<{ id: string }>(
  { options: {
    key: "idem-1",
    command: "DoThing",
    scope: { userId: "usr_id1" },
    payload: { foo: 1 }
  }},
  { uow: InMemoryUoW, store: new InMemoryIdempotencyStore(), hash: (s) => s },
  async (tx) => ok({ id: "123" })
);
```

See docs/ for usage guides & more.
````

## File: packages/sdk-lite/tsconfig.json
````json
{
  "compilerOptions": {
    "lib": ["ES2022"],
    "target": "ES2022",
    "module": "ESNext",
    "moduleResolution": "Bundler",
    "declaration": true,
    "declarationMap": false,
    "emitDeclarationOnly": false,
    "outDir": "dist",
    "rootDir": "src",
    "strict": true,
    "noUncheckedIndexedAccess": true,
    "skipLibCheck": true,
    "verbatimModuleSyntax": true
  },
  "include": ["src"]
}
````

## File: packages/sdk-lite/tsup.config.ts
````typescript
import { defineConfig } from "tsup";

export default defineConfig({
  entry: ["src/index.ts"],
  format: ["esm", "cjs"], // produce both import/require
  dts: true, // generate .d.ts
  sourcemap: false,
  clean: true,
  treeshake: true,
  minify: false,
  target: "es2022",
});
````

## File: .gitignore
````
# dev
.yarn/
!.yarn/releases
.vscode/*
!.vscode/launch.json
!.vscode/*.code-snippets
.idea/workspace.xml
.idea/usage.statistics.xml
.idea/shelf
dist/

# deps
node_modules/

# env
.env
.env.production

# logs
logs/
*.log
npm-debug.log*
yarn-debug.log*
yarn-error.log*
pnpm-debug.log*
lerna-debug.log*

# misc
.DS_Store
````

## File: pnpm-workspace.yaml
````yaml
packages:
  - "packages/*"
  - "apps/*"
````

## File: tsconfig.json
````json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "moduleResolution": "Bundler",
    "strict": true,
    "skipLibCheck": true,
    "noUncheckedIndexedAccess": true,
    "verbatimModuleSyntax": true
  }
}
````

## File: apps/finance-api/src/adapters/hono/types.ts
````typescript
// apps/finance-api/src/adapters/hono/types.ts

import { AggregateCrudRepository } from "@acme/sdk-lite";
import type { UnitOfWork } from "@acme/sdk-lite/infra";
import { RealEstateCommandHandler } from "../../application/real-estate/real-estate.handler";
import { RealEstate } from "../../domain/real-estate/real-estate.aggregate";

// What commands need from the app (clock + id factory)
export type AppEnv = { newId(): string; now(): Date };

// Variables we store on Hono's context (c.var)
export type Vars = {
  uow: UnitOfWork;
  env: AppEnv;
  reRepo: AggregateCrudRepository<RealEstate>;
  // Add the new handler for injection
  reCmdHandler: RealEstateCommandHandler;
};
````

## File: apps/finance-api/src/domain/real-estate/real-estate.aggregate.ts
````typescript
// finance-api/src/domain/real-estate/aggregate.ts
// -----------------------------------------------------------------------------
// RealEstate aggregate with "English-like" invariants.
// - Intrinsic rules (no I/O) are expressed via the invariants DSL and thrown
//   as DomainInvariantError (HTTP 422 at the edge).
// - Events are recorded for each mutation (append-only event buffer).
// -----------------------------------------------------------------------------

import { AggregateRoot, invariants } from "@acme/sdk-lite/domain";
import { Money } from "../shared/money";
import type { PricePoint, RealEstateDetails } from "./types";

/** Helper to build a PricePoint (date + monetary value) */
export const pp = (
  date: string,
  amount: number,
  currency: string
): PricePoint => ({
  date,
  value: Money.from(amount, currency),
});

export class RealEstate extends AggregateRoot {
  private constructor(
    id: string,
    public readonly userId: string,
    private _details: RealEstateDetails,
    private _purchase: PricePoint,
    private _appraisals: PricePoint[],
    private _marketVals: PricePoint[]
  ) {
    super(id);
  }

  // Factory
  // -------
  // Enforces intrinsic rules about initial state, then emits RealEstateCreated.
  static create(args: {
    id: string;
    userId: string;
    details: RealEstateDetails;
    purchase: PricePoint;
    now?: () => string; // ISO string producer (override for testing)
  }) {
    const { id, userId, details, purchase } = args;

    // Domain invariants (no I/O), expressed "in English"
    invariants({ aggregate: "RealEstate", operation: "create", id })
      .ensure(
        "Il nome è obbligatorio.",
        "real_estate.name_required",
        details.name?.trim().length > 0,
        { name: details.name }
      )
      .ensure(
        "La valuta dell'acquisto deve coincidere con la baseCurrency.",
        "real_estate.name_required",
        purchase.value.props.currency === details.baseCurrency,
        {
          purchaseCurrency: purchase.value.props.currency,
          baseCurrency: details.baseCurrency,
        }
      )
      .must(
        "La data di acquisto deve essere una data valida ISO-8601.",
        "real_estate.purchase_date_valid",
        () => !Number.isNaN(Date.parse(purchase.date)),
        { purchaseDate: purchase.date }
      )
      .throwIfAny("RealEstate.Invalid");

    const agg = new RealEstate(id, userId, details, purchase, [], []);

    agg.record("RealEstateCreated", {
      id,
      userId,
      at: args.now?.() ?? new Date().toISOString(),
    });

    return agg;
  }

  // Rehydration from persisted state
  static fromState(s: {
    id: string;
    userId: string;
    version: number;
    details: RealEstateDetails;
    purchase: PricePoint;
    appraisals: PricePoint[];
    marketVals: PricePoint[];
  }) {
    const agg = new RealEstate(
      s.id,
      s.userId,
      s.details,
      s.purchase,
      s.appraisals,
      s.marketVals
    );
    agg.version = s.version;
    return agg;
  }

  // Read-model-ish getters (immutable views on internal state)
  get details() {
    return this._details;
  }
  get purchase() {
    return this._purchase;
  }
  get appraisals() {
    return [...this._appraisals];
  }
  get marketValuations() {
    return [...this._marketVals];
  }

  // Command handlers (mutations)
  // ----------------------------

  addAppraisal(p: PricePoint) {
    // Intrinsic rules for a new appraisal relative to the purchase
    invariants({
      aggregate: "RealEstate",
      operation: "addAppraisal",
      id: this.id,
    })
      .must(
        "La data di perizia deve essere una data valida ISO-8601.",
        "real_estate.appraisal_date_valid",
        () => !Number.isNaN(Date.parse(p.date)),
        { date: p.date }
      )
      .ensure(
        "La perizia non può essere antecedente alla data di acquisto.",
        "real_estate.appraisal_not_before_purchase",
        new Date(p.date) >= new Date(this._purchase.date),
        { appraisalAt: p.date, purchaseAt: this._purchase.date }
      )
      .ensure(
        "La valuta della perizia deve coincidere con la baseCurrency.",
        "real_estate.appraisal_currency_matches_base",
        p.value.props.currency === this._details.baseCurrency,
        {
          appraisalCurrency: p.value.props.currency,
          baseCurrency: this._details.baseCurrency,
        }
      )
      .throwIfAny("RealEstate.Invalid");

    this._appraisals = appendSortedByDate(this._appraisals, p);

    this.record("RealEstateAppraised", {
      id: this.id,
      date: p.date,
      value: p.value.props,
    });
  }

  addMarketValuation(p: PricePoint) {
    // Intrinsic rules for a new market valuation relative to the purchase
    invariants({
      aggregate: "RealEstate",
      operation: "addMarketValuation",
      id: this.id,
    })
      .must(
        "La data di valutazione deve essere una data valida ISO-8601.",
        "real_estate.market_value_date_valid",
        () => !Number.isNaN(Date.parse(p.date)),
        { date: p.date }
      )
      .ensure(
        "La valutazione non può essere antecedente alla data di acquisto.",
        "real_estate.market_value_not_before_purchase",
        new Date(p.date) >= new Date(this._purchase.date),
        { valuationAt: p.date, purchaseAt: this._purchase.date }
      )
      .ensure(
        "La valuta della valutazione deve coincidere con la baseCurrency.",
        "real_estate.market_value_currency_matches_base",
        p.value.props.currency === this._details.baseCurrency,
        {
          valuationCurrency: p.value.props.currency,
          baseCurrency: this._details.baseCurrency,
        }
      )
      .throwIfAny("RealEstate.Invalid");

    this._marketVals = appendSortedByDate(this._marketVals, p);

    this.record("RealEstateMarketValued", {
      id: this.id,
      date: p.date,
      value: p.value.props,
    });
  }

  updateDetails(next: Partial<Omit<RealEstateDetails, "baseCurrency">>) {
    // Only intrinsic checks about new details (no I/O)
    invariants({
      aggregate: "RealEstate",
      operation: "updateDetails",
      id: this.id,
    })
      .ensure(
        "Il nome è obbligatorio.",
        "real_estate.name_required",
        next.name === undefined ? true : next.name.trim().length > 0,
        { name: next.name }
      )
      .throwIfAny("RealEstate.Invalid");

    this._details = { ...this._details, ...next };

    this.record("RealEstateDetailsUpdated", {
      id: this.id,
      changed: next,
    });
  }
}

// ---- helpers ----

/** Insert and return a list sorted by ISO date ascending (stable for equal dates). */
function appendSortedByDate(list: PricePoint[], p: PricePoint) {
  return [...list, p].sort((a, b) => a.date.localeCompare(b.date));
}
````

## File: apps/finance-api/src/domain/real-estate/types.ts
````typescript
import { ValueObject } from "@acme/sdk-lite/domain";
import { Money } from "../shared/money";

export class Address extends ValueObject<{
  line1: string;
  line2?: string;
  postalCode: string;
  city: string;
  state?: string;
  country: string;
}> {
  static of(a: Omit<Address["props"], never>) {
    return new Address(a);
  }
}

export type PricePoint = { date: string; value: Money };

export type RealEstateDetails = {
  name: string;
  address: Address;
  notes?: string;
  baseCurrency: string;
};
````

## File: apps/finance-api/src/routes/real-estate.routes.ts
````typescript
// apps/finance-api/src/routes/real-estate.routes.ts

import { respond } from "@acme/sdk-lite";
import { Hono } from "hono";
import { realEstateApiHandler } from "../adapters/hono/commands/real-estate/real-estate.api-handler";
import type { Vars } from "../adapters/hono/types";

export const realEstateRoutes = new Hono<{ Variables: Vars }>();

/**
 * A single POST endpoint for creating a RealEstate asset.
 * The body should be: { "command": "createRealEstate", "payload": { ... } }
 */
realEstateRoutes.post("/", async (c) =>
  respond(c, await realEstateApiHandler(c), 201)
);

/**
 * For commands that operate on an existing aggregate (update, add appraisal, etc.),
 * we can reuse the same API handler on a route with an ID.
 * The body would be: { "command": "addAppraisal", "payload": { ... } }
 */
realEstateRoutes.post("/:id", async (c) =>
  respond(c, await realEstateApiHandler(c), 200)
);
````

## File: apps/finance-api/src/app.ts
````typescript
import { OpenAPIHono, createRoute, z as zopenapi } from "@hono/zod-openapi";
import { Hono } from "hono";
import { ulid } from "ulid";
import { Vars } from "./adapters/hono/types";
import { env } from "./config";
import { DrizzleUoW } from "./infra/uow.drizzle";
import { realEstateRoutes } from "./routes/real-estate.routes";

// Use OpenAPIHono so we can define routes + serve the spec
const app = new OpenAPIHono<{ Variables: Vars }>();

// Instantiate dependencies once
const reRepo = new RealEstateDrizzleRepo();
const uow = DrizzleUoW;
const appEnv = {
  newId: () => ulid(),
  now: () => new Date(),
};

// Create an instance of our new command handler.
const reCmdHandler = new RealEstateCommandHandler({
  repo: reRepo,
  uow,
  ...appEnv,
});

// Example auth stub (replace with your real auth)
app.use("*", async (c, next) => {
  // set an authenticated user id for demo; replace with your auth middleware
  // c.set("userId", "demo-user-123");

  // set uow + env + handlers for commands
  c.set("uow", uow);
  c.set("reRepo", reRepo);
  c.set("env", appEnv);
  c.set("reCmdHandler", reCmdHandler); // Inject the handler instance

  await next();
});

// --- DOMAIN: mount real-estate routes ---
app.route("/v1/real-estates", realEstateRoutes);

// --- health ---
app.on(["GET", "HEAD"], "/healthz", (c) => {
  if (c.req.method === "HEAD") return c.body(null, 200); // empty body for HEAD
  return c.text("system healthy");
});

// --- root ---
app.get("/", (c) => c.text(`API v1.0: ${env.NODE_ENV} is running`));

// --- typed /hello with OpenAPI ---
const HelloQuery = zopenapi.object({
  name: zopenapi.string().optional().openapi({ example: "world" }),
});
const HelloResp = zopenapi.object({
  message: zopenapi.string(),
});

app.openapi(
  createRoute({
    method: "get",
    path: "/hello",
    request: { query: HelloQuery },
    responses: {
      200: {
        description: "Greets the user",
        content: { "application/json": { schema: HelloResp } },
      },
    },
    tags: ["demo"],
  }),
  (c) => {
    const { name = "world" } = Object.fromEntries(
      new URL(c.req.url).searchParams
    ) as { name?: string };
    return c.json({ message: `Hello, ${name}!` });
  }
);

// --- serve OpenAPI JSON ---
app.doc("/openapi.json", {
  openapi: "3.1.0",
  info: { title: "Hono API", version: "1.0.0" },
});

// --- docs UI (Swagger-like via Scalar) ---
import { Scalar } from "@scalar/hono-api-reference";
import { RealEstateCommandHandler } from "./application/real-estate/real-estate.handler";
import { RealEstateDrizzleRepo } from "./infra/repo.real-estate.drizzle";
app.get(
  "/docs",
  Scalar({
    theme: "kepler",
    layout: "modern",
    url: "/openapi.json",
  })
);

// --- PostHog proxy: /ph/* -> POSTHOG_HOST/* ---
const proxy = new Hono();
proxy.all("/ph/*", async (c) => {
  const incoming = new URL(c.req.url);
  const upstreamPath = incoming.pathname.replace(/^\/ph/, "") || "/";
  const upstreamUrl = new URL(upstreamPath + incoming.search, env.POSTHOG_HOST);

  const method = c.req.method.toUpperCase();
  const headers = new Headers(c.req.raw.headers);
  headers.delete("host");
  headers.delete("content-length");

  const body =
    method === "GET" || method === "HEAD"
      ? undefined
      : await c.req.arrayBuffer();

  const resp = await fetch(upstreamUrl, {
    method,
    headers,
    body,
    redirect: "manual",
  });

  const respHeaders = new Headers(resp.headers);
  respHeaders.set("access-control-allow-origin", "*"); // optional

  return new Response(resp.body, {
    status: resp.status,
    statusText: resp.statusText,
    headers: respHeaders,
  });
});

app.route("/", proxy);

export default app;
````

## File: apps/finance-api/package.json
````json
{
  "name": "@apps/finance-api",
  "version": "0.0.0",
  "private": true,
  "type": "module",
  "scripts": {
    "dev": "tsx watch src/server.ts",
    "build": "tsup src/server.ts --format esm,cjs",
    "start": "node dist/server.js",
    "db:generate": "drizzle-kit generate:pg",
    "db:push": "drizzle-kit push"
  },
  "dependencies": {
    "@acme/sdk-lite": "workspace:*",
    "@hono/node-server": "^1.4.0",
    "@hono/zod-openapi": "^0.16.0",
    "@scalar/hono-api-reference": "^0.9.13",
    "drizzle-orm": "^0.33.0",
    "hono": "^4.4.0",
    "pg": "^8.12.0",
    "ulid": "^2.4.0",
    "zod": "^4.0.17"
  },
  "devDependencies": {
    "@types/node": "^20.14.0",
    "@types/pg": "^8.15.5",
    "drizzle-kit": "^0.20.0",
    "rimraf": "^6.0.0",
    "tsup": "^8.0.1",
    "tsx": "^4.7.1",
    "typescript": "^5.6.0"
  },
  "engines": {
    "node": ">=18.17"
  },
  "packageManager": "pnpm@9.0.0+sha512.b4106707c7225b1748b61595953ccbebff97b54ad05d002aa3635f633b9c53cd666f7ce9b8bc44704f1fa048b9a49b55371ab2d9e9d667d1efe2ef1514bcd513"
}
````

## File: packages/sdk-lite/src/application/command/crud/runner.ts
````typescript
/**
 * CRUD Command Runner
 * -------------------
 * A reusable pipeline for CRUD-based aggregates:
 *   1) load -> 2) policies -> 3) run -> 4) save -> 5) publish
 *
 * Works under any HTTP framework or even without HTTP.
 * Pair it with `withIdempotency` + `UnitOfWork` at the handler level.
 */

import type { Tx } from "../../../infra/unit-of-work";
import { err, ok, type Result } from "../../../shared/result";
import type { Policy } from "../../policies";
import type { CrudLoader, CrudPublisher, CrudRunner, CrudSaver } from "./types";

export function makeCrudCommand<TEnv, TCmd, TAgg, TOut>(deps: {
  load: CrudLoader<TAgg, TCmd, TEnv>;
  run: CrudRunner<TAgg, TCmd, TEnv, TOut>;
  save: CrudSaver<TAgg, TEnv>;
  publish?: CrudPublisher;
  policies?: Policy<TEnv, TCmd>[];
}) {
  const combinedPolicy: Policy<TEnv, TCmd> | undefined =
    deps.policies && deps.policies.length
      ? async (args) => {
          for (const p of deps.policies!) {
            const r = await p(args);
            if (!r.ok) return r;
          }
          return ok(true);
        }
      : undefined;

  return async function execute(args: {
    tx: Tx;
    env: TEnv;
    cmd: TCmd;
  }): Promise<Result<TOut>> {
    // PREP: Load current aggregate (can be null for creations)
    const current = await deps.load({
      tx: args.tx,
      env: args.env,
      cmd: args.cmd,
    });

    // CHECK: Domain policies / invariants
    if (combinedPolicy) {
      const pr = await combinedPolicy({ env: args.env, cmd: args.cmd });
      if (!pr.ok) return err(pr.error);
    }

    // EXEC: Apply command
    const exec = await deps.run({
      current,
      env: args.env,
      cmd: args.cmd,
      tx: args.tx,
    });
    if (!exec.ok) return exec;

    // SAVE: Persist next state
    await deps.save({ next: exec.value.next, env: args.env, tx: args.tx });

    // PUB: Optionally publish events
    if (exec.value.events?.length && deps.publish) {
      await deps.publish(exec.value.events, args.tx);
    }

    // DONE: Return response DTO
    return ok(exec.value.response);
  };
}
````

## File: packages/sdk-lite/src/application/command/es/runner.ts
````typescript
/**
 * ES Command Runner
 * -----------------
 * Reusable pipeline for event-sourced aggregates:
 *   1) load -> 2) policies -> 3) run -> 4) append -> 5) publish
 *
 * Use it under UnitOfWork + withIdempotency from the handler layer.
 */

import type { Tx } from "../../../infra/unit-of-work";
import { err, ok, type Result } from "../../../shared/result";
import type { Policy } from "../../policies";
import type { EsAppender, EsLoader, EsPublisher, EsRunner } from "./types";

export function makeEsCommand<TEnv, TCmd, TOut>(deps: {
  load: EsLoader<TCmd, TEnv>;
  run: EsRunner<TCmd, TEnv, TOut>;
  append: EsAppender<TCmd, TEnv>;
  publish?: EsPublisher;
  policies?: Policy<TEnv, TCmd>[];
}) {
  const combinedPolicy: Policy<TEnv, TCmd> | undefined =
    deps.policies && deps.policies.length
      ? async (args) => {
          for (const p of deps.policies!) {
            const r = await p(args);
            if (!r.ok) return r;
          }
          return ok(true);
        }
      : undefined;

  return async function execute(args: {
    tx: Tx;
    env: TEnv;
    cmd: TCmd;
  }): Promise<Result<TOut>> {
    // PREP: read history + expected revision
    const loaded = await deps.load({
      tx: args.tx,
      env: args.env,
      cmd: args.cmd,
    });

    // CHECK: domain invariants
    if (combinedPolicy) {
      const pr = await combinedPolicy({ env: args.env, cmd: args.cmd });
      if (!pr.ok) return err(pr.error);
    }

    // EXEC: produce new events + response
    const exec = await deps.run({
      past: loaded.events,
      env: args.env,
      cmd: args.cmd,
      tx: args.tx,
    });
    if (!exec.ok) return exec;

    // SAVE: append new events with optimistic concurrency
    await deps.append({
      env: args.env,
      cmd: args.cmd,
      tx: args.tx,
      toAppend: exec.value.toAppend,
      expectedRevision: loaded.revision,
    });

    // PUB: optionally publish events
    if (exec.value.toAppend?.length && deps.publish) {
      await deps.publish(exec.value.toAppend, args.tx);
    }

    // DONE: return response DTO
    return ok(exec.value.response);
  };
}
````

## File: packages/sdk-lite/src/application/command/index.ts
````typescript
/**
 * Command blueprints entrypoint.
 * Re-export CRUD and ES flavors from a single place so apps can:
 *   import { makeCrudCommand, makeEsCommand } from "@acme/sdk-lite";
 */

export * from "./crud/runner";
export * from "./crud/types";
export * from "./es/runner";
export * from "./es/types";
````

## File: packages/sdk-lite/src/domain/index.ts
````typescript
// packages/sdk-lite/src/domain/index.ts

// Re-export domain primitives
export * from "./aggregate"; // AggregateRoot, Entity, ValueObject, etc.
export * from "./invariants"; // DomainInvariantError, invariants DSL

// re-export shared errors like DomainInvariantError
export * from "../shared/errors";
````

## File: packages/sdk-lite/src/http/request-handler.ts
````typescript
// sdk-lite/src/http/request-handler.ts

import type * as Z from "zod";
import type { SafeParseReturnType, ZodTypeAny } from "zod";
import type { EdgeError } from "../shared/errors";
import { err, ok, type Result } from "../shared/result";

/**
 * AuthFn
 * ------
 * Reads authentication/identity info from the HTTP framework context.
 * Return:
 * - ok(payload) on success (e.g., { userId })
 * - err({ kind: "Unauthorized" }) if not authenticated
 */
export type AuthFn<C, A> = (
  c: C
) => Result<A, EdgeError> | Promise<Result<A, EdgeError>>;

/**
 * BodyReader
 * ------
 * an overridable function to read the request body
 */
export type BodyReader<C> = (c: C) => Promise<unknown>;

/**
 * makeRequestHandler
 * ------------------
 * A small reusable wrapper for HTTP request handling.
 *
 * It does three things in order:
 *  1) Auth check
 *  2) JSON body parse + Zod validate
 *  3) Map ({ c, auth, body }) -> your DTO/result
 *
 * Generics:
 *   C = framework context type (e.g., Hono Context<{ Variables: Vars }>)
 *   A = Auth payload type (e.g., { userId: string })
 *   S = Zod schema type
 *   O = Output payload type
 *
 * Why this pattern?
 * - Keeps all edge concerns in one place and consistent across routes.
 * - Makes your route handlers tiny and easy to read.
 *
 */
export function makeRequestHandler<
  C = any,
  A = unknown,
  S extends ZodTypeAny = ZodTypeAny,
  O = unknown
>(opts: {
  auth: AuthFn<C, A>;
  bodySchema: S; // any Zod schema
  map: (ctx: {
    c: C;
    auth: A;
    body: Z.infer<S>; // <- body type derives from schema
  }) => Result<O, EdgeError> | Promise<Result<O, EdgeError>>;
  readBody?: BodyReader<C>;
}) {
  const readBody: BodyReader<C> =
    opts.readBody ?? (async (c) => (c as any).req.json()); // default keeps Hono happy

  return async function requestHandler(c: C): Promise<Result<O, EdgeError>> {
    // 1) IAM / auth
    const auth = await opts.auth(c);
    if (!auth.ok) return auth;

    // 2) JSON body parsing
    let raw: unknown;
    try {
      raw = await readBody(c); // using the pluggable reader
    } catch (e) {
      return err({
        kind: "BadRequest",
        message: "Invalid JSON body",
        details: String(e),
      });
    }

    // 3) Zod validation
    const parsed = opts.bodySchema.safeParse(raw) as SafeParseReturnType<
      unknown,
      Z.infer<S>
    >;
    if (!parsed.success) {
      return err({
        kind: "BadRequest",
        message: "Invalid body",
        details: parsed.error.flatten(),
      });
    }

    // 4) Mapping to your executor DTO; may also fail (e.g., more checks)
    return opts.map({ c, auth: auth.value, body: parsed.data });
  };
}

/**
 * authFromContext("userId")
 * -------------------------
 * Convenience for reading a simple identity from the request context.
 * If the context doesn't have that key → Unauthorized.
 */
/** authFromContext("userId"): read a simple identity from c.get(key) */
type HasGet = { get: (key: string) => unknown };

export const authFromContext =
  <C extends HasGet, K extends string = "userId">(key: K = "userId" as K) =>
  (c: C): Result<{ [P in K]: string }, EdgeError> => {
    const uid = c.get(key) as string | undefined;
    return uid ? ok({ [key]: uid } as any) : err({ kind: "Unauthorized" });
  };
````

## File: packages/sdk-lite/src/idempotency/types.ts
````typescript
import type { IdempotencyStore } from "../infra/idempotency-store";
import type { UnitOfWork } from "../infra/unit-of-work";

/** Provide your own stable hash function (e.g., sha256). */
export type Hasher = (s: string) => string;

/**
 * IdempotencyConfigOptions<T>
 * ---------------------------
 * Per-call configuration for idempotent commands.
 *
 * key:
 *   - string: idempotency enabled
 *   - null:   idempotency explicitly disabled (forces the caller to be intentional)
 *
 * command:
 *   Human-readable command name (e.g., "CreateOrder") used in storage keys.
 *
 * scope:
 *   Small namespace to avoid cross-tenant collisions (e.g., { userId }).
 *
 * payload:
 *   Canonical payload used to detect "same command" retries.
 *
 * toResponse / reviveOnHit:
 *   Control how results are serialized and revived from the store.
 *   Defaults are identity/cast, which is fine if your result is simple JSON.
 *
 * clock:
 *   Override for testing predictable timestamps.
 */
export type IdempotencyConfigOptions<T> = {
  key: string | null;
  command: string;
  scope: Record<string, string>;
  payload: unknown;
  toResponse?: (value: T) => unknown;
  reviveOnHit?: (response: unknown) => T;
  clock?: { now(): Date };
};

/**
 * IdempotencyInfra
 * ----------------
 * Runtime dependencies to make idempotency work:
 * - uow: transaction runner
 * - store: idempotency persistence
 * - hash: stable hashing (sha256 recommended)
 */
export type IdempotencyInfra = {
  uow: UnitOfWork;
  store: IdempotencyStore;
  hash: Hasher;
};
````

## File: packages/sdk-lite/src/infra/idempotency-store.ts
````typescript
// packages/sdk-lite/src/infra/idempotency-store.ts

import type { Tx } from "./unit-of-work";

/**
 * IdempotencyStore
 * ----------------
 * Stores the canonical result of a command keyed by (key, scope, command).
 *
 * Why?
 * - If a client retries the same command (network issues, timeouts),
 *   we return the **same** result without doing the work twice.
 *
 * Guarantees expected from an implementation:
 * - tryClaim must be **atomic**:
 *     - If entry doesn't exist → create "claimed" placeholder (no response yet).
 *     - If entry exists with a response → return that response.
 *     - If entry exists without response → treat as "claimed" (in-flight).
 * - saveResponse stores the final canonical response for future retries.
 */
export interface IdempotencyStore {
  /**
   * Try to claim the key for this command+scope+payload.
   * Returns:
   * - "claimed" if we can proceed and compute the result now.
   * - { response } if the canonical result already exists → return it instead.
   */
  tryClaim(args: {
    key: string;
    command: string;
    scopeHash: string; // small namespace hash (e.g., { userId })
    payloadHash: string; // hash of canonical payload (what "same" means)
    now: Date;
    tx: Tx;
  }): Promise<"claimed" | { response: unknown }>;

  /**
   * Save the canonical response so future retries short-circuit.
   */
  saveResponse(args: {
    key: string;
    command: string;
    scopeHash: string;
    response: unknown;
    tx: Tx;
  }): Promise<void>;
}
````

## File: packages/sdk-lite/src/infra/unit-of-work.ts
````typescript
// packages/sdk-lite/src/infra/unit-of-work.ts

/**
 * Unit of Work (UoW) + Transaction marker
 * ---------------------------------------
 * "Tx" is a **transaction handle** passed to repositories so multiple
 * DB writes can happen atomically (all succeed or all roll back).
 *
 * Important:
 * - We **do not** define Tx's internals here. It's intentionally empty.
 * - The real DB layer (e.g., Drizzle/Prisma/Postgres) decides what a Tx is.
 * - Application/domain code just **passes Tx around** without caring about the DB.
 *
 * Benefits:
 * - You can swap databases/libs with minimal app changes.
 * - Tests can pass a fake Tx object easily.
 */
export interface Tx {} // Placeholder/opaque transaction token

export interface UnitOfWork {
  /**
   * Run "fn" inside a DB transaction and return its result.
   * Implementations should:
   * - start a transaction,
   * - call "fn(tx)",
   * - commit on success or rollback on error.
   */
  withTransaction<T>(fn: (tx: Tx) => Promise<T>): Promise<T>;
}
````

## File: packages/sdk-lite/src/shared/result.ts
````typescript
/**
 * Result type helpers
 * -------------------
 * A tiny alternative to exceptions: every function can return either:
 * - ok(value): success path
 * - err(error): failure path
 *
 * Why?
 * - Callers can handle both outcomes explicitly.
 * - Easier to test and to map into HTTP responses later.
 */

export type Ok<T> = { ok: true; value: T };
export type Err<E> = { ok: false; error: E };
export type Result<T, E = any> = Ok<T> | Err<E>;

/** Wrap a value into a success Result. */
export const ok = <T>(value: T): Ok<T> => ({ ok: true, value });

/** Wrap an error payload into a failure Result. */
export const err = <E>(error: E): Err<E> => ({ ok: false, error });
````

## File: packages/sdk-lite/package.json
````json
{
    "name": "@acme/sdk-lite",
    "version": "0.1.0",
    "private": false,
    "description": "Lightweight CQRS/DDD helpers: Result, domain errors, idempotency orchestration, request handler, and test doubles.",
    "license": "MIT",
    "author": "Acme",
    "repository": {
        "type": "git",
        "url": "https://github.com/your-org/sdk-lite.git"
    },
    "homepage": "https://github.com/your-org/sdk-lite#readme",
    "bugs": {
        "url": "https://github.com/your-org/sdk-lite/issues"
    },
    "type": "module",
    "main": "./dist/index.cjs",
    "module": "./dist/index.js",
    "types": "./dist/index.d.ts",
    "exports": {
        ".": {
            "types": "./dist/index.d.ts",
            "import": "./dist/index.js",
            "require": "./dist/index.cjs"
        },
        "./domain": {
            "types": "./dist/domain/index.d.ts",
            "import": "./dist/domain/index.js",
            "require": "./dist/domain/index.cjs"
        },
        "./infra": {
            "types": "./dist/infra/index.d.ts",
            "import": "./dist/infra/index.js",
            "require": "./dist/infra/index.cjs"
        }
    },
    "sideEffects": false,
    "files": [
        "dist",
        "README.md"
    ],
    "scripts": {
        "build": "tsup src/index.ts src/domain/index.ts src/infra/index.ts --dts --format esm,cjs",
        "dev": "tsup src/index.ts src/domain/index.ts src/infra/index.ts --dts --format esm,cjs --watch",
        "clean": "rimraf dist",
        "typecheck": "tsc --noEmit",
        "lint": "echo \"(add eslint if you want)\"",
        "prepublishOnly": "npm run clean && npm run build && npm run typecheck"
    },
    "peerDependencies": {
        "zod": "^3.23.0"
    },
    "devDependencies": {
        "@types/node": "^20.14.0",
        "rimraf": "^6.0.0",
        "tsup": "^8.0.1",
        "typescript": "^5.6.0",
        "zod": "^3.23.0"
    },
    "engines": {
        "node": ">=18.17"
    },
    "keywords": [
        "cqrs",
        "ddd",
        "idempotency",
        "result",
        "request-handler",
        "toolkit",
        "typescript"
    ]
}
````

## File: package.json
````json
{
    "name": "@acme/monorepo",
    "private": true,
    "packageManager": "pnpm@9.0.0",
    "workspaces": [
        "packages/*",
        "apps/*"
    ],
    "scripts": {
        "build": "pnpm -w -r --filter ./packages... run build"
    },
    "pnpm": {
        "overrides": {
            "zod": "^3.23.0"
        }
    }
}
````

## File: apps/finance-api/src/infra/repo.real-estate.drizzle.ts
````typescript
/**
 * Drizzle CRUD Repository for the RealEstate Aggregate.
 * This class implements the full contract for loading and saving the aggregate,
 * handling both creation of new entities and updates to existing ones.
 */
import { AggregateCrudRepository, Tx } from "@acme/sdk-lite";
import { and, eq } from "drizzle-orm";
import { RealEstate } from "../domain/real-estate/real-estate.aggregate";
import { Address } from "../domain/real-estate/types";
import { Money } from "../domain/shared/money";
import {
  realEstateAppraisals,
  realEstateMarketVals,
  realEstates,
} from "./schema";
import { asDrizzle } from "./uow.drizzle";

export class RealEstateDrizzleRepo
  implements AggregateCrudRepository<RealEstate>
{
  /**
   * Loads a RealEstate aggregate and all its child entities from the database.
   * This method rehydrates the full aggregate root.
   * @param tx - The database transaction handle.
   * @param id - The ID of the aggregate to load.
   * @returns The rehydrated RealEstate aggregate, or null if not found.
   */
  async load(tx: Tx, id: string): Promise<RealEstate | null> {
    const dtx = asDrizzle(tx);

    const root = await dtx.query.realEstates.findFirst({
      where: eq(realEstates.id, id),
    });

    if (!root) return null;

    // Load child entities in parallel for efficiency.
    const [apps, mvals] = await Promise.all([
      dtx.query.realEstateAppraisals.findMany({
        where: eq(realEstateAppraisals.realEstateId, id),
      }),
      dtx.query.realEstateMarketVals.findMany({
        where: eq(realEstateMarketVals.realEstateId, id),
      }),
    ]);

    // Rehydrate the aggregate from its raw state using the static factory.
    const agg = RealEstate.fromState({
      id,
      userId: root.userId,
      version: root.version,
      details: {
        name: root.name,
        address: Address.of({
          line1: root.addr1,
          line2: root.addr2 ?? undefined,
          postalCode: root.postalCode,
          city: root.city,
          state: root.state ?? undefined,
          country: root.country,
        }),
        notes: root.notes ?? undefined,
        baseCurrency: root.baseCurrency,
      },
      purchase: {
        date: root.purchaseDate,
        value: Money.from(Number(root.purchaseValue), root.baseCurrency),
      },
      appraisals: apps.map((r) => ({
        date: r.date,
        value: Money.from(Number(r.value), root.baseCurrency),
      })),
      marketVals: mvals.map((r) => ({
        date: r.date,
        value: Money.from(Number(r.value), root.baseCurrency),
      })),
    });

    return agg;
  }

  /**
   * Persists the RealEstate aggregate. It intelligently handles both
   * creating a new record and updating an existing one based on the aggregate's version.
   * @param tx - The database transaction handle.
   * @param agg - The RealEstate aggregate to persist.
   */
  async save(tx: Tx, agg: RealEstate): Promise<void> {
    // A version of 0 indicates a newly created aggregate that needs to be inserted.
    if (agg.version === 0) {
      await this.insert(tx, agg);
    } else {
      await this.update(tx, agg);
    }
  }

  /**
   * Inserts a new RealEstate aggregate into the database.
   * This is called for brand new aggregates (version 0).
   */
  private async insert(tx: Tx, agg: RealEstate): Promise<void> {
    const dtx = asDrizzle(tx);

    // Insert the root aggregate record.
    await dtx.insert(realEstates).values({
      id: agg.id,
      userId: agg.userId,
      name: agg.details.name,
      addr1: agg.details.address.props.line1,
      addr2: agg.details.address.props.line2 ?? null,
      postalCode: agg.details.address.props.postalCode,
      city: agg.details.address.props.city,
      state: agg.details.address.props.state ?? null,
      country: agg.details.address.props.country,
      notes: agg.details.notes ?? null,
      baseCurrency: agg.details.baseCurrency,
      purchaseDate: agg.purchase.date,
      purchaseValue: agg.purchase.value.props.amount,
      version: 1, // Set initial version to 1 after creation.
    });

    // NOTE: For a create command, appraisals and market valuations will be empty,
    // so these inserts will be no-ops, which is correct.
    if (agg.appraisals.length > 0) {
      await dtx.insert(realEstateAppraisals).values(
        agg.appraisals.map((p) => ({
          realEstateId: agg.id,
          date: p.date,
          value: p.value.props.amount,
        }))
      );
    }

    if (agg.marketValuations.length > 0) {
      await dtx.insert(realEstateMarketVals).values(
        agg.marketValuations.map((p) => ({
          realEstateId: agg.id,
          date: p.date,
          value: p.value.props.amount,
        }))
      );
    }

    // After a successful save, the in-memory aggregate's version is bumped.
    agg.version = 1;
  }

  /**
   * Updates an existing RealEstate aggregate in the database.
   * This uses optimistic concurrency control based on the version number.
   */
  private async update(tx: Tx, agg: RealEstate): Promise<void> {
    const dtx = asDrizzle(tx);
    const nextVersion = agg.version + 1;

    // Update the root aggregate record, checking the version to prevent conflicts.
    const result = await dtx
      .update(realEstates)
      .set({
        name: agg.details.name,
        addr1: agg.details.address.props.line1,
        addr2: agg.details.address.props.line2 ?? null,
        postalCode: agg.details.address.props.postalCode,
        city: agg.details.address.props.city,
        state: agg.details.address.props.state ?? null,
        country: agg.details.address.props.country,
        notes: agg.details.notes ?? null,
        baseCurrency: agg.details.baseCurrency, // Note: Domain logic prevents this from changing.
        purchaseDate: agg.purchase.date,
        purchaseValue: agg.purchase.value.props.amount,
        version: nextVersion,
      })
      .where(
        and(eq(realEstates.id, agg.id), eq(realEstates.version, agg.version))
      );

    // If no rows were affected, it means the version was stale (optimistic lock failed).
    if (result.rowCount === 0) {
      throw new Error(
        `Optimistic concurrency conflict. RealEstate aggregate ${agg.id} with version ${agg.version} not found.`
      );
    }

    // For child collections, the simplest strategy is to delete and re-insert.
    // This is robust and easy to implement.
    await dtx
      .delete(realEstateAppraisals)
      .where(eq(realEstateAppraisals.realEstateId, agg.id));
    if (agg.appraisals.length > 0) {
      await dtx.insert(realEstateAppraisals).values(
        agg.appraisals.map((p) => ({
          realEstateId: agg.id,
          date: p.date,
          value: p.value.props.amount,
        }))
      );
    }

    await dtx
      .delete(realEstateMarketVals)
      .where(eq(realEstateMarketVals.realEstateId, agg.id));
    if (agg.marketValuations.length > 0) {
      await dtx.insert(realEstateMarketVals).values(
        agg.marketValuations.map((p) => ({
          realEstateId: agg.id,
          date: p.date,
          value: p.value.props.amount,
        }))
      );
    }

    // Increment the in-memory version to match the database.
    agg.version = nextVersion;
  }
}
````

## File: packages/sdk-lite/src/index.ts
````typescript
/**
 * @acme/sdk-lite — Barrel exports
 *
 * Why a single "index" file?
 * - Consumers can import everything from one place:
 *     import { ok, withIdempotency } from "@acme/sdk-lite";
 * - Internally we keep small modules (single responsibility) and re-export them here.
 */

// Result + errors
export * from "./shared/errors";
export * from "./shared/result";

// Infra ports
export * from "./infra/idempotency-store";
export * from "./infra/unit-of-work";

// Idempotency orchestrator
export * from "./idempotency/types";
export * from "./idempotency/with-idempotency";

// HTTP edge helpers
export * from "./http/request-handler";
export * from "./http/respond";

// Command blueprints (CRUD + ES)
export * from "./application/command";
export * from "./application/command/command";
export * from "./application/command/handler";

// Policies (application-layer contextual rules)
export * from "./application/policies";

// Aggregate primitives
export * from "./application/repos";

// Test doubles
export * from "./memory/idempotency-store.memory";
export * from "./memory/unit-of-work.memory";

// NOTE: we do NOT re-export the "domain" folder here to avoid naming collisions.
// Apps can import domain primitives via the subpath: @acme/sdk-lite/domain
````
