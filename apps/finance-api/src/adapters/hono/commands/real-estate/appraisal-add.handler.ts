/**
 * Hono handler for AddAppraisal
 */
import { authFromContext, makeRequestHandler, ok } from "@acme/sdk-lite";
import { type Context } from "hono";
import {
  AddAppraisalBody,
  addAppraisal,
} from "../../../../application/commands/real-estate/add-appraisal.cmd";
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
