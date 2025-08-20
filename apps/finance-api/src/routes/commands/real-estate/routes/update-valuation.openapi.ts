import { createRoute } from "@hono/zod-openapi";
import { jsonContent } from "stoker/openapi/helpers";
import {
  ErrorResponseSchema,
  HttpPhrases,
  HttpStatus,
  SuccessResponseSchema,
} from "../../../../../../../packages/ddd-kit/dist";
import { updateValuationPayloadSchema } from "../../../../application/commands/real-estate/update-valuation/update-valuation.schema";

export const updateValuationRoute = createRoute({
  method: "post",
  path: "/update-valuation",
  tags: ["Real Estate"],
  summary: "Update an existing formal valuation on an asset",
  request: {
    body: jsonContent(
      updateValuationPayloadSchema,
      "The valuation details to update on the real estate asset."
    ),
  },
  responses: {
    [HttpStatus.OK]: {
      ...jsonContent(
        SuccessResponseSchema,
        `${HttpPhrases.OK}: Valuation updated successfully.`
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
