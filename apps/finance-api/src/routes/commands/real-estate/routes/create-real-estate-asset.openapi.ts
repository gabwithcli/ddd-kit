import {
  ErrorResponseSchema,
  HttpPhrases,
  HttpStatus,
  openapiJsonContent,
  SuccessResponseSchema,
} from "@acme/ddd-kit";
import { createRoute } from "@hono/zod-openapi";
import { createRealEstateAssetPayloadSchema } from "../../../../application/commands/real-estate/create-real-estate-asset/create-real-estate-asset.schema";

export const createRealEstateAssetRoute = createRoute({
  method: "post",
  path: "/create-real-estate-asset",
  tags: ["Real Estate"],
  summary: "Create a new real estate asset",
  request: {
    body: openapiJsonContent(
      createRealEstateAssetPayloadSchema,
      "The details of the new real estate asset to create."
    ),
  },
  responses: {
    [HttpStatus.CREATED]: {
      ...openapiJsonContent(
        SuccessResponseSchema,
        `${HttpPhrases.CREATED}: Asset created successfully.`
      ),
    },
    [HttpStatus.UNPROCESSABLE_ENTITY]: {
      ...openapiJsonContent(
        ErrorResponseSchema,
        `${HttpPhrases.UNPROCESSABLE_ENTITY}: A business rule was violated.`
      ),
    },
    [HttpStatus.BAD_REQUEST]: {
      ...openapiJsonContent(
        ErrorResponseSchema,
        `${HttpPhrases.BAD_REQUEST}: The request body is invalid.`
      ),
    },
  },
});
