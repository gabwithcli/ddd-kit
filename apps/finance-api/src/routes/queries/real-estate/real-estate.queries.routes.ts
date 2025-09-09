import { OpenAPIHono } from "@hono/zod-openapi";
import { HttpStatus, respond } from "ddd-kit";
import { listRealEstateAssetsApiHandler } from "src/adapters/hono/queries/real-estate/list-real-estate-assets.api-handler";
import { Vars } from "../../../adapters/hono/types";
import { listRealEstateAssetsRoute } from "./list-real-estate-assets.openapi";

export const realEstateQueryRoutes = new OpenAPIHono<{ Variables: Vars }>();

realEstateQueryRoutes.openapi(listRealEstateAssetsRoute, async (c) =>
  respond(c, await listRealEstateAssetsApiHandler(c), HttpStatus.OK)
);
