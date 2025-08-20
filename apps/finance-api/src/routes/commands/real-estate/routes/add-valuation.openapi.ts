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
      addValuationPayloadSchema,
      "The valuation details to add to the real estate asset."
    ),
  },
  responses: {
    [HttpStatus.CREATED]: {
      ...openapiJsonContent(
        SuccessResponseSchema,
        `${HttpPhrases.CREATED}: Valuation added successfully.`
      ),
    },
    [HttpStatus.NOT_FOUND]: {
      ...openapiJsonContent(
        ErrorResponseSchema,
        `${HttpPhrases.NOT_FOUND}: The asset was not found.`
      ),
    },
  },
});
