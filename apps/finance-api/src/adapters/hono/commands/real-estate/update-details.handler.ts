/**
 * Hono handler for UpdateRealEstateDetails
 */
import { authFromContext, makeRequestHandler, ok } from "@acme/sdk-lite";
import { type Context } from "hono";
import {
  UpdateRealEstateDetailsBody,
  updateRealEstateDetails,
} from "../../../../application/commands/real-estate/update-details.cmd";
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
