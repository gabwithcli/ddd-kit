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
} from "../../../../application/commands/real-estate/create.cmd";
import { Vars } from "../../types";

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
