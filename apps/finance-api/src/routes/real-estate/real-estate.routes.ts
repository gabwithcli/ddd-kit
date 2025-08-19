// ## File: apps/finance-api/src/routes/real-estate.routes.ts

import { HttpStatus, respond } from "@acme/sdk-lite";
import { OpenAPIHono } from "@hono/zod-openapi";
import { realEstateApiHandler } from "../../adapters/hono/commands/real-estate/real-estate.api-handler";
import { Vars } from "../../adapters/hono/types";
import { createRealEstateRoute } from "./commands/create.openapi";
import { deleteRealEstateRoute } from "./commands/delete.openapi";

// We use OpenAPIHono to automatically generate API documentation from our routes.
export const realEstateRoutes = new OpenAPIHono<{ Variables: Vars }>();

// --- ROUTE DECLARATION ---
realEstateRoutes.openapi(createRealEstateRoute, async (c) =>
  respond(c, await realEstateApiHandler(c), HttpStatus.CREATED)
);

realEstateRoutes.openapi(deleteRealEstateRoute, async (c) =>
  respond(c, await realEstateApiHandler(c), HttpStatus.OK)
);
