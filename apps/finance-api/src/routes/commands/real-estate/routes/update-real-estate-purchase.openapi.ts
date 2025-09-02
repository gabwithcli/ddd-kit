import { createRoute, z } from "@hono/zod-openapi";
import {
  ErrorResponseSchema,
  HttpPhrases,
  HttpStatus,
  idempotencyKeyHeader,
  openapiJsonContent,
  SuccessResponseSchema,
} from "ddd-kit";
import { updateRealEstatePurchasePayloadExample } from "src/application/commands/real-estate/update-real-estate-purchase/update-real-estate-purchase.command.example";
import { updateRealEstatePurchasePayloadSchema } from "src/application/commands/real-estate/update-real-estate-purchase/update-real-estate-purchase.command.schema";

export const updateRealEstatePurchaseRoute = createRoute({
  method: "post",
  path: "/update-real-estate-purchase",
  tags: ["Real Estate"],
  summary: "Update the initial purchase details of an asset",
  request: {
    headers: z.object({
      ...idempotencyKeyHeader(
        "Prevents accidental duplicate updates to financial data."
      ),
    }),
    body: openapiJsonContent(
      "The initial purchase details of the real estate asset to update.",
      updateRealEstatePurchasePayloadSchema,
      updateRealEstatePurchasePayloadExample
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
