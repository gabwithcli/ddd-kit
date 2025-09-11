// ## File: apps/finance-api/src/adapters/hono/commands/real-estate/real-estate.commands.api-handler.ts

import { authFromContext, makeRequestHandler, withIdempotency } from "ddd-kit";
import { type Context } from "hono";
import { createHash } from "node:crypto";
import { RealEstateCommandRequest } from "../../../../application/commands/real-estate/real-estate.commands";
import { Vars } from "../../types";

type Ctx = Context<{ Variables: Vars }>;

// A simple but effective SHA256 hash function for creating a stable hash of the scope.
const hash = (s: string) => createHash("sha256").update(s).digest("hex");

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

  /**
   * 4. Map the request to the application layer.
   * This function is now the main orchestrator for the entire operation. It sets up
   * and calls the `withIdempotency` wrapper, which in turn calls the command handler
   * within a single, atomic transaction.
   * @param {object} context - The context object containing the Hono context `c`,
   * authentication details `auth`, and the validated request `body`.
   * @returns {Promise<Result<unknown>>} The result of the operation, which will be the
   * successful command response or a structured error.
   */
  map: ({ c, auth, body }) => {
    // Get all necessary infrastructure dependencies from the Hono context.
    const handler = c.var.handlers.real_estate;
    const uow = c.var.persistence.uow;
    const store = c.var.persistence.idempotencyStore;

    // Enrich the client payload with server-side context like the authenticated userId.
    const payloadWithAuth = { ...body.payload, userId: auth.userId };

    // Get the idempotency key from the request header. It's optional and can be null.
    const idempotencyKey = c.req.header("Idempotency-Key") || null;

    // Execute the command, now wrapped with our idempotency logic.
    return withIdempotency(
      {
        /**
         * Configuration for the idempotency check itself.
         */
        options: {
          key: idempotencyKey,
          command: body.command,
          scope: { userId: auth.userId },
          payload: payloadWithAuth,
        },
      },
      /**
       * The infrastructure dependencies needed for the wrapper to run.
       */
      { uow, store, hash },
      /**
       * This inner function is the atomic "unit of work".
       * It will only be executed if the idempotency check passes.
       * The `tx` parameter it receives is the single, atomic transaction for the entire operation.
       * @param {Tx} tx - The active transaction handle.
       */
      (tx) => {
        const payload: Record<string, any> = body.payload;
        // If the command requires an aggregate ID, we extract it from the body payload.
        // This is typically the case for commands that operate on existing aggregates.
        const aggregateId = payload?.id ?? ""; // ugly, we assume the ID is always present for commands that require it.

        // We call our refactored handler, passing the transaction context `tx`.
        // This ensures the handler's logic executes within the single transaction
        // managed by the idempotency wrapper, achieving true atomicity.
        return handler.execute(
          body.command,
          {
            aggregateId,
            payload: payloadWithAuth,
          },
          tx
        );
      }
    );
  },
});
