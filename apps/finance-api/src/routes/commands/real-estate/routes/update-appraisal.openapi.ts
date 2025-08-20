import {
  ErrorResponseSchema,
  HttpPhrases,
  HttpStatus,
  openapiJsonContent,
  SuccessResponseSchema,
} from "@acme/ddd-kit";
import { createRoute } from "@hono/zod-openapi";
import { updateAppraisalPayloadSchema } from "../../../../application/commands/real-estate/update-appraisal/update-appraisal.schema";

export const updateAppraisalRoute = createRoute({
  method: "post",
  path: "/update-appraisal",
  tags: ["Real Estate"],
  summary: "Update an existing appraisal on an asset",
  request: {
    body: openapiJsonContent(
      updateAppraisalPayloadSchema,
      "The appraisal details to update on the real estate asset."
    ),
  },
  responses: {
    [HttpStatus.OK]: {
      ...openapiJsonContent(
        SuccessResponseSchema,
        `${HttpPhrases.OK}: Appraisal updated successfully.`
      ),
    },
    [HttpStatus.NOT_FOUND]: {
      ...openapiJsonContent(
        ErrorResponseSchema,
        `${HttpPhrases.NOT_FOUND}: The asset or appraisal was not found.`
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
