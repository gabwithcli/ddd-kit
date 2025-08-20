import {
  ErrorResponseSchema,
  HttpPhrases,
  HttpStatus,
  SuccessResponseSchema,
} from "@acme/sdk-lite";
import { createRoute } from "@hono/zod-openapi";
import { jsonContent } from "stoker/openapi/helpers";
import { deleteRealEstatePayloadSchema } from "../../../application/commands/real-estate/delete-real-estate-asset/delete.schema";

export const deleteRealEstateAssetRoute = createRoute({
  method: "post",
  // The resource ID is part of the URL path, following REST conventions.
  path: "/delete-real-estate-asset",
  tags: ["Real Estate"],
  summary: "Delete a real estate asset",
  request: {
    // The request body is defined by the command's payload schema.
    // This creates a direct link between our API contract and our application layer.
    body: jsonContent(
      deleteRealEstatePayloadSchema,
      "The ID of the real estate asset to delete."
    ),
  },
  responses: {
    [HttpStatus.OK]: {
      ...jsonContent(
        SuccessResponseSchema,
        `${HttpPhrases.OK}: Asset deleted successfully.`
      ),
    },
    [HttpStatus.NOT_FOUND]: {
      ...jsonContent(
        ErrorResponseSchema,
        `${HttpPhrases.NOT_FOUND}: The specified asset was not found.`
      ),
    },
    [HttpStatus.UNPROCESSABLE_ENTITY]: {
      ...jsonContent(
        ErrorResponseSchema,
        `${HttpPhrases.UNPROCESSABLE_ENTITY}: A business rule was violated (e.g., asset already deleted).`
      ),
    },
  },
});
