import { createRoute } from "@hono/zod-openapi";
import {
  ErrorResponseSchema,
  HttpPhrases,
  HttpStatus,
  openapiJsonContent,
  SuccessResponseSchema,
} from "ddd-kit";
import { updateRealEstatePurchasePayloadSchema } from "../../../../application/commands/real-estate/update-real-estate-purchase/update-real-estate-purchase.command.example";

export const updateRealEstatePurchaseRoute = createRoute({
  method: "post",
  path: "/update-real-estate-purchase",
  tags: ["Real Estate"],
  summary: "Update the initial purchase details of an asset",
  request: {
    body: openapiJsonContent(
      "The initial purchase details of the real estate asset to update.",
      updateRealEstatePurchasePayloadSchema
    ),
  },
  responses: {
    [HttpStatus.OK]: {
      ...openapiJsonContent(
        `${HttpPhrases.OK}: Asset purchase updated successfully.`,
        SuccessResponseSchema
      ),
    },
    [HttpStatus.NOT_FOUND]: {
      ...openapiJsonContent(
        `${HttpPhrases.NOT_FOUND}: The asset was not found.`,
        ErrorResponseSchema
      ),
    },
    [HttpStatus.UNPROCESSABLE_ENTITY]: {
      ...openapiJsonContent(
        `${HttpPhrases.UNPROCESSABLE_ENTITY}: A business rule was violated.`,
        ErrorResponseSchema
      ),
    },
  },
});
