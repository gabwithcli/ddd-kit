import {
  ErrorResponseSchema,
  HttpPhrases,
  HttpStatus,
  openapiJsonContent,
  SuccessResponseSchema,
} from "@acme/ddd-kit";
import { createRoute } from "@hono/zod-openapi";
import { updateValuationPayloadSchema } from "../../../../application/commands/real-estate/update-valuation/update-valuation.schema";

export const updateValuationRoute = createRoute({
  method: "post",
  path: "/update-valuation",
  tags: ["Real Estate"],
  summary: "Update an existing formal valuation on an asset",
  request: {
    body: openapiJsonContent(
      updateValuationPayloadSchema,
      "The valuation details to update on the real estate asset."
    ),
  },
  responses: {
    [HttpStatus.OK]: {
      ...openapiJsonContent(
        SuccessResponseSchema,
        `${HttpPhrases.OK}: Valuation updated successfully.`
      ),
    },
    [HttpStatus.NOT_FOUND]: {
      ...openapiJsonContent(
        ErrorResponseSchema,
        `${HttpPhrases.NOT_FOUND}: The asset or valuation was not found.`
      ),
    },
  },
});
