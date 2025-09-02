import { createRoute } from "@hono/zod-openapi";
import {
  ErrorResponseSchema,
  HttpPhrases,
  HttpStatus,
  openapiJsonContent,
  SuccessResponseSchema,
} from "ddd-kit";
import { deleteValuationPayloadExample } from "src/application/commands/real-estate/delete-valuation/delete-valuation.command.example";
import { deleteValuationPayloadSchema } from "src/application/commands/real-estate/delete-valuation/delete-valuation.command.schema";

export const deleteValuationRoute = createRoute({
  method: "post",
  path: "/delete-valuation",
  tags: ["Real Estate"],
  summary: "Delete a formal valuation from an asset",
  request: {
    body: openapiJsonContent(
      "The ID of the valuation to delete from the real estate asset.",
      deleteValuationPayloadSchema,
      deleteValuationPayloadExample
    ),
  },
  responses: {
    [HttpStatus.OK]: {
      ...openapiJsonContent(
        `${HttpPhrases.OK}: Valuation deleted successfully.`,
        SuccessResponseSchema
      ),
    },
    [HttpStatus.NOT_FOUND]: {
      ...openapiJsonContent(
        `${HttpPhrases.NOT_FOUND}: The asset or valuation was not found.`,
        ErrorResponseSchema
      ),
    },
  },
});
