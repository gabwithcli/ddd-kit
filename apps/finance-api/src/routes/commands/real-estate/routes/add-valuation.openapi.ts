import { createRoute } from "@hono/zod-openapi";
import { jsonContent } from "stoker/openapi/helpers";
import {
  ErrorResponseSchema,
  HttpPhrases,
  HttpStatus,
  SuccessResponseSchema,
} from "../../../../../../../packages/ddd-kit/dist";
import { addValuationPayloadSchema } from "../../../../application/commands/real-estate/add-valuation/add-valuation.schema";

export const addValuationRoute = createRoute({
  method: "post",
  path: "/add-valuation",
  tags: ["Real Estate"],
  summary: "Add a formal valuation to a real estate asset",
  request: {
    body: jsonContent(
      addValuationPayloadSchema,
      "The valuation details to add to the real estate asset."
    ),
  },
  responses: {
    [HttpStatus.CREATED]: {
      ...jsonContent(
        SuccessResponseSchema,
        `${HttpPhrases.CREATED}: Valuation added successfully.`
      ),
    },
    [HttpStatus.NOT_FOUND]: {
      ...jsonContent(
        ErrorResponseSchema,
        `${HttpPhrases.NOT_FOUND}: The asset was not found.`
      ),
    },
  },
});
