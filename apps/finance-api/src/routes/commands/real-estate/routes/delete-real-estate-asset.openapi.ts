import { createRoute, z } from "@hono/zod-openapi";
import {
  ErrorResponseSchema,
  HttpPhrases,
  HttpStatus,
  idempotencyKeyHeader,
  openapiJsonContent,
  SuccessResponseSchema,
} from "ddd-kit";
import { deleteRealEstateAssetPayloadSchema } from "src/application/commands/real-estate/delete-real-estate-asset/delete-real-estate-asset.command.schema";
import { deleteRealEstateAssetPayloadExample } from "../../../../application/commands/real-estate/delete-real-estate-asset/delete-real-estate-asset.command.example";

export const deleteRealEstateAssetRoute = createRoute({
  method: "post",
  path: "/delete-real-estate-asset",
  tags: ["Real Estate"],
  summary: "Delete a real estate asset",
  request: {
    headers: z.object({
      ...idempotencyKeyHeader(
        "Ensures that a retried delete request still returns a success message instead of a 404 Not Found, which is better for the client."
      ),
    }),
    body: openapiJsonContent(
      "The ID of the real estate asset to delete.",
      deleteRealEstateAssetPayloadSchema,
      deleteRealEstateAssetPayloadExample
    ),
  },
  responses: {
    [HttpStatus.OK]: {
      ...openapiJsonContent(
        `${HttpPhrases.OK}: Asset deleted successfully.`,
        SuccessResponseSchema
      ),
    },
    [HttpStatus.NOT_FOUND]: {
      ...openapiJsonContent(
        `${HttpPhrases.NOT_FOUND}: The specified asset was not found.`,
        ErrorResponseSchema
      ),
    },
  },
});
