import { createRoute } from "@hono/zod-openapi";
import { jsonContent } from "stoker/openapi/helpers";
import {
  ErrorResponseSchema,
  HttpPhrases,
  HttpStatus,
  SuccessResponseSchema,
} from "../../../../../../../packages/ddd-kit/dist";
import { createRealEstateAssetPayloadSchema } from "../../../../application/commands/real-estate/create-real-estate-asset/create-real-estate-asset.schema";

export const createRealEstateAssetRoute = createRoute({
  method: "post",
  path: "/create-real-estate-asset",
  tags: ["Real Estate"],
  summary: "Create a new real estate asset",
  request: {
    body: jsonContent(
      createRealEstateAssetPayloadSchema,
      "The details of the new real estate asset to create."
    ),
  },
  responses: {
    [HttpStatus.CREATED]: {
      ...jsonContent(
        SuccessResponseSchema,
        `${HttpPhrases.CREATED}: Asset created successfully.`
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
