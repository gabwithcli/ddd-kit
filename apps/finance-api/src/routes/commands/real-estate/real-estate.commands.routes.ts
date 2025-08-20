// ## File: apps/finance-api/src/routes/real-estate.routes.ts

import { HttpStatus, respond } from "@acme/sdk-lite";
import { OpenAPIHono } from "@hono/zod-openapi";
import { realEstateApiHandler } from "../../../adapters/hono/commands/real-estate/real-estate.commands.api-handler";
import { Vars } from "../../../adapters/hono/types";
import { createRealEstateAssetRoute } from "./create-real-estate-asset.openapi";
import { deleteRealEstateAssetRoute } from "./delete-real-estate-asset.openapi";

// We use OpenAPIHono to automatically generate API documentation from our routes.
export const realEstateRoutes = new OpenAPIHono<{ Variables: Vars }>();

// --- ROUTE DECLARATION ---
realEstateRoutes.openapi(createRealEstateAssetRoute, async (c) =>
  respond(c, await realEstateApiHandler(c), HttpStatus.CREATED)
);

realEstateRoutes.openapi(deleteRealEstateAssetRoute, async (c) =>
  respond(c, await realEstateApiHandler(c), HttpStatus.OK)
);
