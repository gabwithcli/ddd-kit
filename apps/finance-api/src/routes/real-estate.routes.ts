import { respond } from "@acme/sdk-lite";
import { Hono } from "hono";
import {
  addAppraisalHandler,
  addMarketValuationHandler,
  createRealEstateHandler,
  updateRealEstateDetailsHandler,
} from "../adapters/hono/commands/real-estate";
import type { Vars } from "../adapters/hono/types";

export const realEstateRoutes = new Hono<{ Variables: Vars }>();

realEstateRoutes.post("/create", async (c) =>
  respond(c, await createRealEstateHandler(c), 201)
);
/**
 * route to add: "/:id/delete/"
 */
realEstateRoutes.post("/:id/appraisals/add", async (c) =>
  respond(c, await addAppraisalHandler(c), 200)
);
/**
 * route to add: "/:id/appraisals/remove"
 */
realEstateRoutes.post("/:id/market-valuations/add", async (c) =>
  respond(c, await addMarketValuationHandler(c), 200)
);
/**
 * route to add: "/:id/market-valuations/remove"
 */
realEstateRoutes.patch("/:id/details", async (c) =>
  respond(c, await updateRealEstateDetailsHandler(c), 200)
);

