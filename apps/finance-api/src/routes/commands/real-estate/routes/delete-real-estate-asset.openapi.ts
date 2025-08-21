import { createRoute } from "@hono/zod-openapi";
import {
  ErrorResponseSchema,
  HttpPhrases,
  HttpStatus,
  openapiJsonContent,
  SuccessResponseSchema,
} from "ddd-kit";
import { deleteRealEstateAssetPayloadSchema } from "../../../../application/commands/real-estate/delete-real-estate-asset/delete-real-estate-asset.schema";

export const deleteRealEstateAssetRoute = createRoute({
  method: "post",
  path: "/delete-real-estate-asset",
  tags: ["Real Estate"],
  summary: "Delete a real estate asset",
  request: {
    body: openapiJsonContent(
      "The ID of the real estate asset to delete.",
      deleteRealEstateAssetPayloadSchema
    ),
  },
  responses: {
    [HttpStatus.OK]: {
      ...openapiJsonContent(
        `${HttpPhrases.OK}: Asset deleted successfully.`,
        SuccessResponseSchema
      ),
    },
    [HttpStatus.NOT_FOUND]: {
      ...openapiJsonContent(
        `${HttpPhrases.NOT_FOUND}: The specified asset was not found.`,
        ErrorResponseSchema
      ),
    },
  },
});
