import {
  ErrorResponseSchema,
  HttpPhrases,
  HttpStatus,
  SuccessResponseSchema,
} from "@acme/sdk-lite";
import { createRoute } from "@hono/zod-openapi";
import { jsonContent } from "stoker/openapi/helpers";
import { createRealEstateCommandSchema } from "../../../application/commands/real-estate/create-real-estate/create.schema";

export const createRealEstateRoute = createRoute({
  method: "post",
  // The path is '/' relative to where these routes are mounted (e.g., '/v1/real-estates').
  path: "/create",
  tags: ["Real Estate"],
  summary: "Create a new real estate asset",
  request: {
    // The request body is defined by the command's payload schema.
    // This creates a direct link between our API contract and our application layer.
    body: jsonContent(
      createRealEstateCommandSchema,
      "The details of the new real estate asset to create."
    ),
  },
  responses: {
    [HttpStatus.CREATED]: {
      ...jsonContent(
        SuccessResponseSchema,
        `${HttpPhrases.OK}: Asset created successfully.`
      ),
    },
    [HttpStatus.UNPROCESSABLE_ENTITY]: {
      ...jsonContent(
        ErrorResponseSchema,
        `${HttpPhrases.UNPROCESSABLE_ENTITY}: A business rule was violated.`
      ),
    },
    [HttpStatus.BAD_REQUEST]: {
      ...jsonContent(
        ErrorResponseSchema,
        `${HttpPhrases.BAD_REQUEST}: The request body is invalid.`
      ),
    },
  },
});
