import { createRoute } from "@hono/zod-openapi";
import { jsonContent } from "stoker/openapi/helpers";
import {
  ErrorResponseSchema,
  HttpPhrases,
  HttpStatus,
  SuccessResponseSchema,
} from "../../../../../../../packages/ddd-kit/dist";
import { deleteRealEstateAssetPayloadSchema } from "../../../../application/commands/real-estate/delete-real-estate-asset/delete-real-estate-asset.schema";

export const deleteRealEstateAssetRoute = createRoute({
  method: "post",
  path: "/delete-real-estate-asset",
  tags: ["Real Estate"],
  summary: "Delete a real estate asset",
  request: {
    body: jsonContent(
      deleteRealEstateAssetPayloadSchema,
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
  },
});
