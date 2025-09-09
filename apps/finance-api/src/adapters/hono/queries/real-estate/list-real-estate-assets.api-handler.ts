import { authFromContext, makeRequestHandler, ok } from "ddd-kit";
import type { Context } from "hono";
import { z } from "zod";
import { Vars } from "../../types";

type Ctx = Context<{ Variables: Vars }>;

const emptySchema = z.object({});

export const listRealEstateAssetsApiHandler = makeRequestHandler<
  Ctx,
  { userId: string },
  typeof emptySchema,
  unknown
>({
  auth: authFromContext<Ctx>("userId"),
  bodySchema: emptySchema,
  readBody: async () => ({}),
  map: async ({ c, auth }) => {
    const assets = await c.var.queries.real_estate.listAssetsByUser(
      auth.userId
    );
    return ok(assets);
  },
});
