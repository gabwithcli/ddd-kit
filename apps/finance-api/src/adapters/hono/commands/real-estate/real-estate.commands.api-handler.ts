// apps/finance-api/src/adapters/hono/commands/real-estate/real-estate.commands.api-handler.ts

import { authFromContext, makeRequestHandler } from "@acme/ddd-kit";
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

  // 2. Define a custom body reader.
  // This function intercepts the request body, combines it with the
  // command name from the URL, and constructs the object that our
  // application layer's validation schema (`RealEstateCommandRequest`) expects.
  readBody: async (c: Ctx) => {
    // Extract the command name from the last segment of the URL path.
    // e.g., for "/v1/commands/real-estate/create-real-estate-asset", this gets "create-real-estate-asset".
    const path = c.req.path;
    const commandName = path.substring(path.lastIndexOf("/") + 1);

    // Read the raw JSON payload sent by the client.
    const payload = await c.req.json();

    // Construct the full command object that the application layer expects.
    // This decouples the client's simpler API call (sending only the payload)
    // from the internal command structure.
    return {
      command: commandName,
      payload: payload,
    };
  },

  // 3. Validate the reconstructed request body.
  // The `RealEstateCommandRequest` schema is a discriminated union that
  // validates the `command` name and the corresponding `payload` shape.
  bodySchema: RealEstateCommandRequest,

  // 4. Map the request to the application layer.
  // The `body` parameter here is the fully validated command object.
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
