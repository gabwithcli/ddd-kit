// apps/finance-api/src/adapters/hono/commands/real-estate/real-estate.api-handler.ts

import { authFromContext, makeRequestHandler } from "@acme/sdk-lite";
import { type Context } from "hono";
import { RealEstateCommandRequest } from "../../../../application/commands/real-estate/commands.schema";
import { Vars } from "../../types";

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
    const handler = c.var.handlers.real_estate;
    const payload: Record<string, any> = body.payload;

    // Enrich the client payload with the authenticated userId.
    const payloadWithAuth = { ...body.payload, userId: auth.userId };

    // If the command requires an aggregate ID, we extract it from the body payload.
    // This is typically the case for commands that operate on existing aggregates.
    const aggregateId = payload?.id ?? ""; // ugly, we assume the ID is always present for commands that require it.

    // Execute the command.
    return handler.execute(body.command, {
      aggregateId,
      payload: payloadWithAuth,
    });
  },
});
