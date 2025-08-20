import { createRoute } from "@hono/zod-openapi";
import { jsonContent } from "stoker/openapi/helpers";
import {
  ErrorResponseSchema,
  HttpPhrases,
  HttpStatus,
  SuccessResponseSchema,
} from "../../../../../../../packages/ddd-kit/dist";
import { updateRealEstateDetailsPayloadSchema } from "../../../../application/commands/real-estate/update-real-estate-details/update-real-estate-details.schema";

export const updateRealEstateDetailsRoute = createRoute({
  method: "post",
  path: "/update-real-estate-details",
  tags: ["Real Estate"],
  summary: "Update the details of a real estate asset",
  request: {
    body: jsonContent(
      updateRealEstateDetailsPayloadSchema,
      "The details of the real estate asset to update."
    ),
  },
  responses: {
    [HttpStatus.OK]: {
      ...jsonContent(
        SuccessResponseSchema,
        `${HttpPhrases.OK}: Asset details updated successfully.`
      ),
    },
    [HttpStatus.NOT_FOUND]: {
      ...jsonContent(
        ErrorResponseSchema,
        `${HttpPhrases.NOT_FOUND}: The asset was not found.`
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
