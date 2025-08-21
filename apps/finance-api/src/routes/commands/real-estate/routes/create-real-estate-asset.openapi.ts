import { createRoute } from "@hono/zod-openapi";
import {
  ErrorResponseSchema,
  HttpPhrases,
  HttpStatus,
  openapiJsonContent,
  SuccessResponseSchema,
} from "ddd-kit";
import {
  createRealEstateAssetPayloadExample,
  createRealEstateAssetPayloadSchema,
} from "../../../../application/commands/real-estate/create-real-estate-asset/create-real-estate-asset.schema";

export const createRealEstateAssetRoute = createRoute({
  method: "post",
  path: "/create-real-estate-asset",
  tags: ["Real Estate"],
  summary: "Create a new real estate asset",
  request: {
    body: openapiJsonContent(
      "The details of the new real estate asset to create.",
      createRealEstateAssetPayloadSchema,
      createRealEstateAssetPayloadExample
    ),
  },
  responses: {
    [HttpStatus.CREATED]: {
      ...openapiJsonContent(
        `${HttpPhrases.CREATED}: Asset created successfully.`,
        SuccessResponseSchema
      ),
    },
    [HttpStatus.UNPROCESSABLE_ENTITY]: {
      ...openapiJsonContent(
        `${HttpPhrases.UNPROCESSABLE_ENTITY}: A business rule was violated.`,
        ErrorResponseSchema
      ),
    },
    [HttpStatus.BAD_REQUEST]: {
      ...openapiJsonContent(
        `${HttpPhrases.BAD_REQUEST}: The request body is invalid.`,
        ErrorResponseSchema
      ),
    },
  },
});
