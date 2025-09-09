import { createRoute, z } from "@hono/zod-openapi";
import { HttpPhrases, HttpStatus, openapiJsonContent } from "ddd-kit";
import { RealEstateAssetSummary } from "../../../application/queries/real-estate/list-real-estate-assets.query";

const assetSchema = z.object({
  id: z.string(),
  userId: z.string(),
  name: z.string(),
  purchaseDate: z.string(),
  purchaseValue: z.number(),
  baseCurrency: z.string(),
  deletedAt: z.iso.datetime().nullable(),
});

export const listRealEstateAssetsRoute = createRoute({
  method: "get",
  path: "/assets",
  tags: ["Real Estate"],
  summary: "List real estate assets for the current user",
  responses: {
    [HttpStatus.OK]: openapiJsonContent(
      `${HttpPhrases.OK}: Assets fetched successfully`,
      z.array(assetSchema)
    ),
  },
});
export type ListRealEstateAssetsResponse = RealEstateAssetSummary[];
