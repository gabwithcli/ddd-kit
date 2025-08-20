import {
  ErrorResponseSchema,
  HttpPhrases,
  HttpStatus,
  openapiJsonContent,
  SuccessResponseSchema,
} from "@acme/ddd-kit";
import { createRoute } from "@hono/zod-openapi";
import { updateRealEstatePurchasePayloadSchema } from "../../../../application/commands/real-estate/update-real-estate-purchase/update-real-estate-purchase.schema";

export const updateRealEstatePurchaseRoute = createRoute({
  method: "post",
  path: "/update-real-estate-purchase",
  tags: ["Real Estate"],
  summary: "Update the initial purchase details of an asset",
  request: {
    body: openapiJsonContent(
      updateRealEstatePurchasePayloadSchema,
      "The initial purchase details of the real estate asset to update."
    ),
  },
  responses: {
    [HttpStatus.OK]: {
      ...openapiJsonContent(
        SuccessResponseSchema,
        `${HttpPhrases.OK}: Asset purchase updated successfully.`
      ),
    },
    [HttpStatus.NOT_FOUND]: {
      ...openapiJsonContent(
        ErrorResponseSchema,
        `${HttpPhrases.NOT_FOUND}: The asset was not found.`
      ),
    },
    [HttpStatus.UNPROCESSABLE_ENTITY]: {
      ...openapiJsonContent(
        ErrorResponseSchema,
        `${HttpPhrases.UNPROCESSABLE_ENTITY}: A business rule was violated.`
      ),
    },
  },
});
