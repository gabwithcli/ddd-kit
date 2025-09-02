import { createRoute, z } from "@hono/zod-openapi";
import {
  ErrorResponseSchema,
  HttpPhrases,
  HttpStatus,
  openapiJsonContent,
  SuccessResponseSchema,
} from "ddd-kit";
import { createRealEstateAssetPayloadSchema } from "src/application/commands/real-estate/create-real-estate-asset/create-real-estate-asset.command.schema";
import { createRealEstateAssetPayloadExample } from "../../../../application/commands/real-estate/create-real-estate-asset/create-real-estate-asset.command.example";

export const createRealEstateAssetRoute = createRoute({
  method: "post",
  path: "/create-real-estate-asset",
  tags: ["Real Estate"],
  summary: "Create a new real estate asset",
  request: {
    headers: z.object({
      "idempotency-key": z
        .string()
        .optional()
        .describe(
          "A unique key to safely retry this request without performing the operation twice. Prevents creating duplicate assets."
        ),
    }),
    body: openapiJsonContent(
      "The details of the new real estate asset to create.",
      createRealEstateAssetPayloadSchema,
      createRealEstateAssetPayloadExample
    ),
  },
  responses: {
    [HttpStatus.CREATED]: {
      ...openapiJsonContent(
        `${HttpPhrases.CREATED}: Asset created successfully.`,
        SuccessResponseSchema
      ),
    },
    [HttpStatus.UNPROCESSABLE_ENTITY]: {
      ...openapiJsonContent(
        `${HttpPhrases.UNPROCESSABLE_ENTITY}: A business rule was violated.`,
        ErrorResponseSchema
      ),
    },
    [HttpStatus.BAD_REQUEST]: {
      ...openapiJsonContent(
        `${HttpPhrases.BAD_REQUEST}: The request body is invalid.`,
        ErrorResponseSchema
      ),
    },
  },
});
