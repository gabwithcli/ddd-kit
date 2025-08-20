import {
  ErrorResponseSchema,
  HttpPhrases,
  HttpStatus,
  SuccessResponseSchema,
} from "@acme/sdk-lite";
import { createRoute } from "@hono/zod-openapi";
import { jsonContent } from "stoker/openapi/helpers";
import { deleteValuationPayloadSchema } from "../../../../application/commands/real-estate/delete-valuation/delete-valuation.schema";

export const deleteValuationRoute = createRoute({
  method: "post",
  path: "/delete-valuation",
  tags: ["Real Estate"],
  summary: "Delete a formal valuation from an asset",
  request: {
    body: jsonContent(
      deleteValuationPayloadSchema,
      "The ID of the valuation to delete from the real estate asset."
    ),
  },
  responses: {
    [HttpStatus.OK]: {
      ...jsonContent(
        SuccessResponseSchema,
        `${HttpPhrases.OK}: Valuation deleted successfully.`
      ),
    },
    [HttpStatus.NOT_FOUND]: {
      ...jsonContent(
        ErrorResponseSchema,
        `${HttpPhrases.NOT_FOUND}: The asset or valuation was not found.`
      ),
    },
  },
});
