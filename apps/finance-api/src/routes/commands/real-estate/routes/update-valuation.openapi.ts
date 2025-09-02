import { createRoute, z } from "@hono/zod-openapi";
import {
  ErrorResponseSchema,
  HttpPhrases,
  HttpStatus,
  idempotencyKeyHeader,
  openapiJsonContent,
  SuccessResponseSchema,
} from "ddd-kit";
import { updateValuationPayloadExample } from "src/application/commands/real-estate/update-valuation/update-valuation.command.example";
import { updateValuationPayloadSchema } from "src/application/commands/real-estate/update-valuation/update-valuation.command.schema";

export const updateValuationRoute = createRoute({
  method: "post",
  path: "/update-valuation",
  tags: ["Real Estate"],
  summary: "Update an existing formal valuation on an asset",
  request: {
    headers: z.object({
      ...idempotencyKeyHeader("Prevents duplicate updates."),
    }),
    body: openapiJsonContent(
      "The valuation details to update on the real estate asset.",
      updateValuationPayloadSchema,
      updateValuationPayloadExample
    ),
  },
  responses: {
    [HttpStatus.OK]: {
      ...openapiJsonContent(
        `${HttpPhrases.OK}: Valuation updated successfully.`,
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
