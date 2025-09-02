import { createRoute, z } from "@hono/zod-openapi";
import {
  ErrorResponseSchema,
  HttpPhrases,
  HttpStatus,
  idempotencyKeyHeader,
  openapiJsonContent,
  SuccessResponseSchema,
} from "ddd-kit";
import { addValuationPayloadSchema } from "src/application/commands/real-estate/add-valuation/add-valuation.command.schema";
import { addValuationPayloadExample } from "../../../../application/commands/real-estate/add-valuation/add-valuation.command.example";

export const addValuationRoute = createRoute({
  method: "post",
  path: "/add-valuation",
  tags: ["Real Estate"],
  summary: "Add a formal valuation to a real estate asset",
  request: {
    headers: z.object({
      ...idempotencyKeyHeader("Prevents adding the same valuation twice."),
    }),
    body: openapiJsonContent(
      "The valuation details to add to the real estate asset.",
      addValuationPayloadSchema,
      addValuationPayloadExample
    ),
  },
  responses: {
    [HttpStatus.CREATED]: {
      ...openapiJsonContent(
        `${HttpPhrases.CREATED}: Valuation added successfully.`,
        SuccessResponseSchema
      ),
    },
    [HttpStatus.NOT_FOUND]: {
      ...openapiJsonContent(
        `${HttpPhrases.NOT_FOUND}: The asset was not found.`,
        ErrorResponseSchema
      ),
    },
  },
});
