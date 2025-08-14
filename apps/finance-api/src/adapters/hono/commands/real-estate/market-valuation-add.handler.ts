/**
 * Hono handler for AddMarketValuation
 */
import { authFromContext, makeRequestHandler, ok } from "@acme/sdk-lite";
import { type Context } from "hono";
import {
  AddMarketValuationBody,
  addMarketValuation,
} from "../../../../application/commands/real-estate/add-market-valuation.cmd";
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
