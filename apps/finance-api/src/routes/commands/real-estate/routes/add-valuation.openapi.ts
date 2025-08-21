import {
  ErrorResponseSchema,
  HttpPhrases,
  HttpStatus,
  openapiJsonContent,
  SuccessResponseSchema,
} from "@acme/ddd-kit";
import { createRoute } from "@hono/zod-openapi";
import { addValuationPayloadSchema } from "../../../../application/commands/real-estate/add-valuation/add-valuation.schema";

export const addValuationRoute = createRoute({
  method: "post",
  path: "/add-valuation",
  tags: ["Real Estate"],
  summary: "Add a formal valuation to a real estate asset",
  request: {
    body: openapiJsonContent(
      "The valuation details to add to the real estate asset.",
      addValuationPayloadSchema
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
