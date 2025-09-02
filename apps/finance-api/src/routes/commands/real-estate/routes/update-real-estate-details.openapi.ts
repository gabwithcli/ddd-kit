import { createRoute } from "@hono/zod-openapi";
import {
  ErrorResponseSchema,
  HttpPhrases,
  HttpStatus,
  openapiJsonContent,
  SuccessResponseSchema,
} from "ddd-kit";
import { updateRealEstateDetailsPayloadExample } from "src/application/commands/real-estate/update-real-estate-details/update-real-estate-details.command.example";
import { updateRealEstateDetailsPayloadSchema } from "src/application/commands/real-estate/update-real-estate-details/update-real-estate-details.command.schema";

export const updateRealEstateDetailsRoute = createRoute({
  method: "post",
  path: "/update-real-estate-details",
  tags: ["Real Estate"],
  summary: "Update the details of a real estate asset",
  request: {
    body: openapiJsonContent(
      "The details of the real estate asset to update.",
      updateRealEstateDetailsPayloadSchema,
      updateRealEstateDetailsPayloadExample
    ),
  },
  responses: {
    [HttpStatus.OK]: {
      ...openapiJsonContent(
        `${HttpPhrases.OK}: Asset details updated successfully.`,
        SuccessResponseSchema
      ),
    },
    [HttpStatus.NOT_FOUND]: {
      ...openapiJsonContent(
        `${HttpPhrases.NOT_FOUND}: The asset was not found.`,
        ErrorResponseSchema
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
