import {
  ErrorResponseSchema,
  HttpPhrases,
  HttpStatus,
  openapiJsonContent,
  SuccessResponseSchema,
} from "@acme/ddd-kit";
import { createRoute } from "@hono/zod-openapi";
import { updateRealEstateDetailsPayloadSchema } from "../../../../application/commands/real-estate/update-real-estate-details/update-real-estate-details.schema";

export const updateRealEstateDetailsRoute = createRoute({
  method: "post",
  path: "/update-real-estate-details",
  tags: ["Real Estate"],
  summary: "Update the details of a real estate asset",
  request: {
    body: openapiJsonContent(
      updateRealEstateDetailsPayloadSchema,
      "The details of the real estate asset to update."
    ),
  },
  responses: {
    [HttpStatus.OK]: {
      ...openapiJsonContent(
        SuccessResponseSchema,
        `${HttpPhrases.OK}: Asset details updated successfully.`
      ),
    },
    [HttpStatus.NOT_FOUND]: {
      ...openapiJsonContent(
        ErrorResponseSchema,
        `${HttpPhrases.NOT_FOUND}: The asset was not found.`
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
