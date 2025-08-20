import {
  ErrorResponseSchema,
  HttpPhrases,
  HttpStatus,
  openapiJsonContent,
  SuccessResponseSchema,
} from "@acme/ddd-kit";
import { createRoute } from "@hono/zod-openapi";
import { deleteValuationPayloadSchema } from "../../../../application/commands/real-estate/delete-valuation/delete-valuation.schema";

export const deleteValuationRoute = createRoute({
  method: "post",
  path: "/delete-valuation",
  tags: ["Real Estate"],
  summary: "Delete a formal valuation from an asset",
  request: {
    body: openapiJsonContent(
      deleteValuationPayloadSchema,
      "The ID of the valuation to delete from the real estate asset."
    ),
  },
  responses: {
    [HttpStatus.OK]: {
      ...openapiJsonContent(
        SuccessResponseSchema,
        `${HttpPhrases.OK}: Valuation deleted successfully.`
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
