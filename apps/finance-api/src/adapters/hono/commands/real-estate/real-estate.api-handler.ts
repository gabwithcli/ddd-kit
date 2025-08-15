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
