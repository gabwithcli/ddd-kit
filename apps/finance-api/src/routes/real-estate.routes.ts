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
