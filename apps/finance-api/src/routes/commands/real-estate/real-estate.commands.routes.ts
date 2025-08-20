import { OpenAPIHono } from "@hono/zod-openapi";
import { HttpStatus, respond } from "../../../../../../packages/ddd-kit/dist";
import { realEstateApiHandler } from "../../../adapters/hono/commands/real-estate/real-estate.commands.api-handler";
import { Vars } from "../../../adapters/hono/types";

// Import all route definitions
import { addAppraisalRoute } from "./routes/add-appraisal.openapi";
import { addValuationRoute } from "./routes/add-valuation.openapi";
import { createRealEstateAssetRoute } from "./routes/create-real-estate-asset.openapi";
import { deleteAppraisalRoute } from "./routes/delete-appraisal.openapi";
import { deleteRealEstateAssetRoute } from "./routes/delete-real-estate-asset.openapi";
import { deleteValuationRoute } from "./routes/delete-valuation.openapi";
import { updateAppraisalRoute } from "./routes/update-appraisal.openapi";
import { updateRealEstateDetailsRoute } from "./routes/update-real-estate-details.openapi";
import { updateRealEstatePurchaseRoute } from "./routes/update-real-estate-purchase.openapi";
import { updateValuationRoute } from "./routes/update-valuation.openapi";

// We use OpenAPIHono to automatically generate API documentation from our routes.
export const realEstateRoutes = new OpenAPIHono<{ Variables: Vars }>();

// A single, generic handler for all real estate commands.
const handler = (c: any) => realEstateApiHandler(c);

// Register all routes
// --- Asset Root Routes ---
realEstateRoutes.openapi(createRealEstateAssetRoute, async (c) =>
  respond(c, await handler(c), HttpStatus.CREATED)
);
realEstateRoutes.openapi(updateRealEstateDetailsRoute, async (c) =>
  respond(c, await handler(c), HttpStatus.OK)
);
realEstateRoutes.openapi(updateRealEstatePurchaseRoute, async (c) =>
  respond(c, await handler(c), HttpStatus.OK)
);
realEstateRoutes.openapi(deleteRealEstateAssetRoute, async (c) =>
  respond(c, await handler(c), HttpStatus.OK)
);

// --- Appraisal Routes ---
realEstateRoutes.openapi(addAppraisalRoute, async (c) =>
  respond(c, await handler(c), HttpStatus.CREATED)
);
realEstateRoutes.openapi(updateAppraisalRoute, async (c) =>
  respond(c, await handler(c), HttpStatus.OK)
);
realEstateRoutes.openapi(deleteAppraisalRoute, async (c) =>
  respond(c, await handler(c), HttpStatus.OK)
);

// --- Valuation Routes ---
realEstateRoutes.openapi(addValuationRoute, async (c) =>
  respond(c, await handler(c), HttpStatus.CREATED)
);
realEstateRoutes.openapi(updateValuationRoute, async (c) =>
  respond(c, await handler(c), HttpStatus.OK)
);
realEstateRoutes.openapi(deleteValuationRoute, async (c) =>
  respond(c, await handler(c), HttpStatus.OK)
);
