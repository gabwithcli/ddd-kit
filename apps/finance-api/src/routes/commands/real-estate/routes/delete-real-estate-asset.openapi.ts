import {
  ErrorResponseSchema,
  HttpPhrases,
  HttpStatus,
  openapiJsonContent,
  SuccessResponseSchema,
} from "@acme/ddd-kit";
import { createRoute } from "@hono/zod-openapi";
import { deleteRealEstateAssetPayloadSchema } from "../../../../application/commands/real-estate/delete-real-estate-asset/delete-real-estate-asset.schema";

export const deleteRealEstateAssetRoute = createRoute({
  method: "post",
  path: "/delete-real-estate-asset",
  tags: ["Real Estate"],
  summary: "Delete a real estate asset",
  request: {
    body: openapiJsonContent(
      deleteRealEstateAssetPayloadSchema,
      "The ID of the real estate asset to delete."
    ),
  },
  responses: {
    [HttpStatus.OK]: {
      ...openapiJsonContent(
        SuccessResponseSchema,
        `${HttpPhrases.OK}: Asset deleted successfully.`
      ),
    },
    [HttpStatus.NOT_FOUND]: {
      ...openapiJsonContent(
        ErrorResponseSchema,
        `${HttpPhrases.NOT_FOUND}: The specified asset was not found.`
      ),
    },
  },
});
