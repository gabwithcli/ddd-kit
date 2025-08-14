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

realEstateRoutes.post("/", async (c) =>
  respond(c, await createRealEstateHandler(c), 201)
);
realEstateRoutes.post("/:id/appraisals", async (c) =>
  respond(c, await addAppraisalHandler(c), 200)
);
realEstateRoutes.post("/:id/market-valuations", async (c) =>
  respond(c, await addMarketValuationHandler(c), 200)
);
realEstateRoutes.patch("/:id", async (c) =>
  respond(c, await updateRealEstateDetailsHandler(c), 200)
);
